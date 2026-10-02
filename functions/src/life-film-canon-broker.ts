import * as admin from "firebase-admin";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { defineSecret } from "firebase-functions/params";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";

const sceneTruthReceiptSecret = defineSecret("URAI_SCENE_TRUTH_RECEIPT_HMAC");
const RECEIPT_TTL_MS = 15 * 60 * 1000;
const SAFE_ID = /^[A-Za-z0-9._:-]{1,128}$/;
const SHA256 = /^[a-f0-9]{64}$/i;

type RecordData = Record<string, unknown>;

function asRecord(value: unknown): RecordData {
  return value && typeof value === "object" && !Array.isArray(value) ? value as RecordData : {};
}

function requireAuth(request: CallableRequest<unknown>) {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication is required.");
  return request.auth;
}

function requireSafeId(value: unknown, field: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!SAFE_ID.test(normalized)) {
    throw new HttpsError("invalid-argument", `Invalid ${field}.`);
  }
  return normalized;
}

function requireSha256(value: unknown, field: string): string {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!SHA256.test(normalized)) {
    throw new HttpsError("invalid-argument", `Invalid ${field}.`);
  }
  return normalized;
}

function secretValue(): string {
  const value = sceneTruthReceiptSecret.value();
  if (!value || Buffer.byteLength(value, "utf8") < 32) {
    throw new HttpsError("failed-precondition", "SceneTruth receipt authority is not configured.");
  }
  return value;
}

function ownerAuthorized(record: RecordData, uid: string, adminClaim: boolean): boolean {
  if (adminClaim) return true;
  if (record.ownerUid === uid) return true;
  const allowed = Array.isArray(record.allowedUids) ? record.allowedUids : [];
  return allowed.includes(uid);
}

function canonicalSceneDigest(record: RecordData): string {
  const stored = typeof record.sceneTruthDigest === "string" ? record.sceneTruthDigest.toLowerCase() : "";
  if (SHA256.test(stored)) return stored;

  const canonical = asRecord(record.canonicalPacket);
  if (!Object.keys(canonical).length) {
    throw new HttpsError("failed-precondition", "Accepted SceneTruth packet has no canonical digest.");
  }

  const stable = JSON.stringify(
    Object.keys(canonical).sort().reduce<RecordData>((acc, key) => {
      acc[key] = canonical[key];
      return acc;
    }, {}),
  );
  return createHash("sha256").update(stable).digest("hex");
}

function mintReceipt(projectId: string, digest: string) {
  const receiptId = randomBytes(18).toString("base64url");
  const expiresAt = Date.now() + RECEIPT_TTL_MS;
  const expiryToken = expiresAt.toString(36);
  const message = `${receiptId}\n${projectId}\n${digest}\n${expiryToken}`;
  const signature = createHmac("sha256", secretValue()).update(message).digest("base64url");
  return {
    receiptRef: `str_${receiptId}_${expiryToken}_${signature}`,
    expiresAt,
  };
}

export const resolveAuthorizedLifeFilmCanon = onCall(
  { enforceAppCheck: true },
  async (request) => {
    const auth = requireAuth(request);
    const data = asRecord(request.data);
    const sourceKey = requireSafeId(data.sourceKey, "sourceKey");
    const projectId = requireSafeId(data.projectId, "projectId");
    const purpose = requireSafeId(data.purpose, "purpose");

    const snap = await admin.firestore().collection("privateLifeFilmCanon").doc(sourceKey).get();
    if (!snap.exists) throw new HttpsError("not-found", "Private canon source is not available.");
    const record = asRecord(snap.data());

    if (!ownerAuthorized(record, auth.uid, auth.token.admin === true)) {
      throw new HttpsError("permission-denied", "Private canon source is not authorized for this caller.");
    }
    if (record.revoked === true || record.generationEligible !== true) {
      throw new HttpsError("failed-precondition", "Private canon source is not generation eligible.");
    }

    const canonicalKey = requireSafeId(record.canonicalKey, "canonicalKey");
    const mediaKind = record.mediaKind === "video" ? "video" : record.mediaKind === "image" ? "image" : null;
    if (!mediaKind) throw new HttpsError("failed-precondition", "Private canon media kind is invalid.");

    return {
      ok: true,
      sourceKey,
      projectId,
      purpose,
      canonicalKey,
      evidenceClass: "visual-canon",
      mediaKind,
      mimeType: typeof record.mimeType === "string" ? record.mimeType : "application/octet-stream",
      byteSize: Number.isFinite(record.byteSize) ? Number(record.byteSize) : 0,
      storageObject: typeof record.storageObject === "string" ? record.storageObject : "",
      generationEligible: true,
      truthBoundary: typeof record.truthBoundary === "string" ? record.truthBoundary : "private-source-only",
      verifiedGeneration: typeof record.verifiedGeneration === "string" ? record.verifiedGeneration : null,
      privacy: {
        rawDrivePointerExposed: false,
        clientDownloadUrlIssued: false,
        privateStorageOnly: true,
      },
    };
  },
);

export const issueAcceptedSceneTruthReceipt = onCall(
  { enforceAppCheck: true, secrets: [sceneTruthReceiptSecret] },
  async (request) => {
    const auth = requireAuth(request);
    const data = asRecord(request.data);
    const projectId = requireSafeId(data.projectId, "projectId");
    const sceneId = requireSafeId(data.sceneId, "sceneId");

    const snap = await admin.firestore().collection("sceneTruthPackets").doc(sceneId).get();
    if (!snap.exists) throw new HttpsError("not-found", "SceneTruth packet was not found.");
    const record = asRecord(snap.data());

    if (!ownerAuthorized(record, auth.uid, auth.token.admin === true)) {
      throw new HttpsError("permission-denied", "SceneTruth packet is not authorized for this caller.");
    }
    if (record.projectId !== projectId) {
      throw new HttpsError("failed-precondition", "SceneTruth project binding does not match.");
    }
    if (record.reviewState !== "accepted" || record.accepted !== true) {
      throw new HttpsError("failed-precondition", "SceneTruth packet is not accepted.");
    }

    const failureCodes = Array.isArray(record.failureCodes) ? record.failureCodes : [];
    const contradictions = Array.isArray(record.unresolvedContradictions) ? record.unresolvedContradictions : [];
    const criticalUnknowns = Array.isArray(record.criticalUnknownFields) ? record.criticalUnknownFields : [];
    if (failureCodes.length || contradictions.length || criticalUnknowns.length) {
      throw new HttpsError("failed-precondition", "SceneTruth packet still contains material blockers.");
    }

    const sceneTruthDigest = canonicalSceneDigest(record);
    requireSha256(sceneTruthDigest, "sceneTruthDigest");
    const receipt = mintReceipt(projectId, sceneTruthDigest);

    await admin.firestore().collection("sceneTruthReceipts").doc(receipt.receiptRef).set({
      receiptRef: receipt.receiptRef,
      uid: auth.uid,
      projectId,
      sceneId,
      sceneTruthDigest,
      issuedAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromMillis(receipt.expiresAt),
      acceptedSceneTruthOnly: true,
      privateCanonEmbedded: false,
    });

    return {
      ok: true,
      receiptRef: receipt.receiptRef,
      sceneTruthDigest,
      expiresAt: new Date(receipt.expiresAt).toISOString(),
      privateCanonEmbedded: false,
    };
  },
);
