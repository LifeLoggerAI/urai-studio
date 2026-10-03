import { createHash } from "node:crypto";
import * as admin from "firebase-admin";
import { HttpsError, onCall, type CallableRequest } from "firebase-functions/v2/https";

type AuthenticatedRequest = CallableRequest<unknown> & {
  auth: NonNullable<CallableRequest<unknown>["auth"]>;
};

type OwnerField = "uid" | "userId";

type StudioCollectionSpec = {
  collection: string;
  ownerFields: readonly OwnerField[];
  deletion: "delete" | "anonymize";
};

const DATA_RIGHTS_SCHEMA_VERSION = "urai-studio-data-rights-v1";
const RESTORE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const PURGE_TARGET_MS = 30 * 24 * 60 * 60 * 1000;
const PAGE_SIZE = 200;

const STUDIO_COLLECTIONS: readonly StudioCollectionSpec[] = [
  { collection: "studioProjects", ownerFields: ["uid", "userId"], deletion: "delete" },
  { collection: "studioScenes", ownerFields: ["uid"], deletion: "delete" },
  { collection: "studioAssets", ownerFields: ["uid", "userId"], deletion: "delete" },
  { collection: "assetJobs", ownerFields: ["uid"], deletion: "delete" },
  { collection: "assetCollections", ownerFields: ["uid"], deletion: "delete" },
  { collection: "studioScrolls", ownerFields: ["uid"], deletion: "delete" },
  { collection: "narratorScripts", ownerFields: ["uid"], deletion: "delete" },
  { collection: "subtitles", ownerFields: ["uid"], deletion: "delete" },
  { collection: "voiceoverJobs", ownerFields: ["uid"], deletion: "delete" },
  { collection: "exportJobs", ownerFields: ["uid"], deletion: "delete" },
  { collection: "studioEvents", ownerFields: ["uid"], deletion: "anonymize" },
  { collection: "xrSessions", ownerFields: ["uid"], deletion: "delete" },
  { collection: "vrSessions", ownerFields: ["uid"], deletion: "delete" },
  { collection: "studioBriefs", ownerFields: ["userId"], deletion: "delete" },
  { collection: "studioJobs", ownerFields: ["userId"], deletion: "delete" },
  { collection: "studioExports", ownerFields: ["userId"], deletion: "delete" },
] as const;

function db() {
  return admin.firestore();
}

function requireAuth(request: CallableRequest<unknown>): AuthenticatedRequest {
  if (!request.auth) throw new HttpsError("unauthenticated", "Authentication is required.");
  return request as AuthenticatedRequest;
}

function requireAdmin(request: CallableRequest<unknown>): AuthenticatedRequest {
  const authenticated = requireAuth(request);
  if (authenticated.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Admin authorization is required.");
  }
  return authenticated;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpsError("invalid-argument", `${field} is required.`);
  }
  return value.trim();
}

function sha256(value: string | Buffer) {
  return createHash("sha256").update(value).digest("hex");
}

function subjectHash(uid: string) {
  return sha256(`urai-studio-data-rights:${uid}`);
}

function nowIso() {
  return new Date().toISOString();
}

function privateObjectPath(uid: string, requestId: string) {
  return `private/data-rights/studio/${uid}/${requestId}.json`;
}

function normalizeForJson(value: unknown): unknown {
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
  if (value instanceof admin.firestore.GeoPoint) return { latitude: value.latitude, longitude: value.longitude };
  if (value instanceof admin.firestore.DocumentReference) return { documentPath: value.path };
  if (Array.isArray(value)) return value.map(normalizeForJson);
  if (value && typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (child !== undefined) output[key] = normalizeForJson(child);
    }
    return output;
  }
  return value;
}

async function queryOwned(spec: StudioCollectionSpec, uid: string) {
  const found = new Map<string, admin.firestore.QueryDocumentSnapshot>();
  for (const ownerField of spec.ownerFields) {
    let cursor: admin.firestore.QueryDocumentSnapshot | undefined;
    for (;;) {
      let query: admin.firestore.Query = db()
        .collection(spec.collection)
        .where(ownerField, "==", uid)
        .orderBy(admin.firestore.FieldPath.documentId())
        .limit(PAGE_SIZE);
      if (cursor) query = query.startAfter(cursor);
      const snapshot = await query.get();
      for (const doc of snapshot.docs) found.set(doc.ref.path, doc);
      if (snapshot.size < PAGE_SIZE) break;
      cursor = snapshot.docs[snapshot.docs.length - 1];
    }
  }
  return [...found.values()].sort((left, right) => left.ref.path.localeCompare(right.ref.path));
}

async function collectOwnedRecords(uid: string) {
  const records: Array<{ path: string; collection: string; data: unknown }> = [];
  const profile = await db().collection("users").doc(uid).get();
  if (profile.exists) {
    records.push({
      path: profile.ref.path,
      collection: "users",
      data: normalizeForJson(profile.data()),
    });
  }

  for (const spec of STUDIO_COLLECTIONS) {
    const documents = await queryOwned(spec, uid);
    for (const document of documents) {
      records.push({
        path: document.ref.path,
        collection: spec.collection,
        data: normalizeForJson(document.data()),
      });
    }
  }

  return records.sort((left, right) => left.path.localeCompare(right.path));
}

async function writePrivatePackage(uid: string, requestId: string, kind: "export" | "deletion-backup") {
  const records = await collectOwnedRecords(uid);
  const generatedAt = nowIso();
  const payload = {
    schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
    kind,
    subjectHash: subjectHash(uid),
    generatedAt,
    recordCount: records.length,
    records,
  };
  const body = Buffer.from(JSON.stringify(payload));
  const checksum = sha256(body);
  const objectPath = privateObjectPath(uid, requestId);
  const file = admin.storage().bucket().file(objectPath);
  await file.save(body, {
    resumable: false,
    contentType: "application/json",
    metadata: {
      cacheControl: "private, no-store, max-age=0",
      metadata: {
        schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
        subjectHash: subjectHash(uid),
        checksum,
        kind,
      },
    },
  });
  return { generatedAt, recordCount: records.length, checksum, objectPath, bytes: body.length };
}

async function assertVerifiedPackage(objectPath: string, expectedChecksum: string) {
  const file = admin.storage().bucket().file(objectPath);
  const [exists] = await file.exists();
  if (!exists) throw new HttpsError("failed-precondition", "Verified deletion backup is missing.");
  const [body] = await file.download();
  const actual = sha256(body);
  if (actual !== expectedChecksum) {
    throw new HttpsError("failed-precondition", "Deletion backup checksum mismatch.");
  }
  return body.length;
}

function requestRef(requestId: string) {
  return db().collection("studioDataRightsRequests").doc(requestId);
}

async function loadOwnedRequest(requestId: string, uid: string) {
  const snapshot = await requestRef(requestId).get();
  if (!snapshot.exists || snapshot.data()?.uid !== uid) {
    throw new HttpsError("not-found", "Studio data-rights request is unavailable.");
  }
  return snapshot;
}

async function writeAudit(event: {
  requestId: string;
  actorUid: string;
  subjectUid: string;
  action: string;
  detail?: Record<string, unknown>;
}) {
  const ref = db().collection("studioDataRightsAudit").doc();
  await ref.set({
    schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
    auditId: ref.id,
    requestId: event.requestId,
    actorUidHash: subjectHash(event.actorUid),
    subjectHash: subjectHash(event.subjectUid),
    action: event.action,
    detail: event.detail ?? {},
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

export const requestStudioDataExport = onCall(async (request) => {
  const uid = requireAuth(request).auth.uid;
  const requestId = db().collection("studioDataRightsRequests").doc().id;
  const packageReceipt = await writePrivatePackage(uid, requestId, "export");

  await requestRef(requestId).set({
    schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
    requestId,
    uid,
    subjectHash: subjectHash(uid),
    type: "export",
    status: "ready",
    packageReceipt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await writeAudit({
    requestId,
    actorUid: uid,
    subjectUid: uid,
    action: "studio_data_export_ready",
    detail: { checksum: packageReceipt.checksum, recordCount: packageReceipt.recordCount },
  });

  return {
    ok: true,
    requestId,
    status: "ready",
    checksum: packageReceipt.checksum,
    recordCount: packageReceipt.recordCount,
    bytes: packageReceipt.bytes,
  };
});

export const requestStudioDataDeletion = onCall(async (request) => {
  const uid = requireAuth(request).auth.uid;
  const requestId = db().collection("studioDataRightsRequests").doc().id;
  const requestedAt = Date.now();
  const restoreUntil = new Date(requestedAt + RESTORE_WINDOW_MS).toISOString();
  const purgeAfter = new Date(requestedAt + PURGE_TARGET_MS).toISOString();
  const packageReceipt = await writePrivatePackage(uid, requestId, "deletion-backup");

  await requestRef(requestId).set({
    schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
    requestId,
    uid,
    subjectHash: subjectHash(uid),
    type: "delete",
    status: "pending_restore_window",
    legalHold: false,
    restoreUntil,
    purgeAfter,
    backupReceipt: packageReceipt,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await writeAudit({
    requestId,
    actorUid: uid,
    subjectUid: uid,
    action: "studio_data_deletion_requested",
    detail: { restoreUntil, purgeAfter, backupChecksum: packageReceipt.checksum },
  });

  return {
    ok: true,
    requestId,
    status: "pending_restore_window",
    restoreUntil,
    purgeAfter,
    backupChecksum: packageReceipt.checksum,
  };
});

export const cancelStudioDataDeletion = onCall(async (request) => {
  const uid = requireAuth(request).auth.uid;
  const data = asRecord(request.data);
  const requestId = requiredString(data.requestId, "requestId");
  const snapshot = await loadOwnedRequest(requestId, uid);
  const value = snapshot.data()!;
  if (value.type !== "delete" || value.status !== "pending_restore_window") {
    throw new HttpsError("failed-precondition", "Deletion request cannot be cancelled in its current state.");
  }
  if (Date.now() > Date.parse(String(value.restoreUntil))) {
    throw new HttpsError("failed-precondition", "Deletion restore window has expired.");
  }

  await snapshot.ref.set({
    status: "cancelled",
    cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  await writeAudit({
    requestId,
    actorUid: uid,
    subjectUid: uid,
    action: "studio_data_deletion_cancelled",
  });
  return { ok: true, requestId, status: "cancelled" };
});

export const setStudioDataDeletionLegalHold = onCall(async (request) => {
  const actor = requireAdmin(request);
  const data = asRecord(request.data);
  const requestId = requiredString(data.requestId, "requestId");
  const active = data.active === true;
  const reason = active ? requiredString(data.reason, "reason") : null;
  const ref = requestRef(requestId);
  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.type !== "delete") {
    throw new HttpsError("not-found", "Deletion request is unavailable.");
  }
  const uid = String(snapshot.data()?.uid || "");
  await ref.set({
    legalHold: active,
    legalHoldReason: reason,
    legalHoldUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  await writeAudit({
    requestId,
    actorUid: actor.auth.uid,
    subjectUid: uid,
    action: active ? "studio_data_deletion_legal_hold_set" : "studio_data_deletion_legal_hold_cleared",
    detail: active ? { reason } : {},
  });
  return { ok: true, requestId, legalHold: active };
});

async function ownedRefs(uid: string) {
  const result = new Map<string, { ref: admin.firestore.DocumentReference; collection: string; deletion: "delete" | "anonymize" }>();
  const profileRef = db().collection("users").doc(uid);
  const profile = await profileRef.get();
  if (profile.exists) result.set(profileRef.path, { ref: profileRef, collection: "users", deletion: "delete" });
  for (const spec of STUDIO_COLLECTIONS) {
    for (const doc of await queryOwned(spec, uid)) {
      result.set(doc.ref.path, { ref: doc.ref, collection: spec.collection, deletion: spec.deletion });
    }
  }
  return [...result.values()].sort((left, right) => left.ref.path.localeCompare(right.ref.path));
}

export const executeStudioDataDeletion = onCall(async (request) => {
  const actor = requireAdmin(request);
  const data = asRecord(request.data);
  const requestId = requiredString(data.requestId, "requestId");
  const ref = requestRef(requestId);

  const snapshot = await ref.get();
  if (!snapshot.exists || snapshot.data()?.type !== "delete") {
    throw new HttpsError("not-found", "Deletion request is unavailable.");
  }
  const value = snapshot.data()!;
  const uid = String(value.uid || "");
  if (!uid) throw new HttpsError("failed-precondition", "Deletion request has no subject.");
  if (value.status !== "pending_restore_window") {
    throw new HttpsError("failed-precondition", "Deletion request is not executable in its current state.");
  }
  if (value.legalHold === true) {
    throw new HttpsError("failed-precondition", "Deletion request is blocked by an active legal hold.");
  }
  if (Date.now() < Date.parse(String(value.restoreUntil))) {
    throw new HttpsError("failed-precondition", "Deletion restore window is still active.");
  }
  const backup = value.backupReceipt as Record<string, unknown> | undefined;
  const objectPath = typeof backup?.objectPath === "string" ? backup.objectPath : "";
  const backupChecksum = typeof backup?.checksum === "string" ? backup.checksum : "";
  if (!objectPath || !/^[a-f0-9]{64}$/i.test(backupChecksum)) {
    throw new HttpsError("failed-precondition", "Deletion request lacks a verified backup receipt.");
  }
  const backupBytes = await assertVerifiedPackage(objectPath, backupChecksum);

  await ref.set({
    status: "executing",
    executionStartedAt: admin.firestore.FieldValue.serverTimestamp(),
    executedByHash: subjectHash(actor.auth.uid),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  const entries = await ownedRefs(uid);
  const counts: Record<string, { deleted: number; anonymized: number }> = {};
  for (let offset = 0; offset < entries.length; offset += 400) {
    const batch = db().batch();
    for (const entry of entries.slice(offset, offset + 400)) {
      counts[entry.collection] ??= { deleted: 0, anonymized: 0 };
      if (entry.deletion === "anonymize") {
        batch.set(entry.ref, {
          schemaVersion: "urai-studio-anonymized-audit-v1",
          subjectHash: subjectHash(uid),
          eventRetainedForAudit: true,
          anonymizedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        counts[entry.collection].anonymized += 1;
      } else {
        batch.delete(entry.ref);
        counts[entry.collection].deleted += 1;
      }
    }
    await batch.commit();
  }

  const completedAt = nowIso();
  const receiptBasis = JSON.stringify({
    schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
    requestId,
    subjectHash: subjectHash(uid),
    backupChecksum,
    counts,
    completedAt,
  });
  const purgeReceipt = {
    receiptId: `studio_purge_${sha256(receiptBasis).slice(0, 32)}`,
    checksum: sha256(receiptBasis),
    completedAt,
    backupChecksum,
    backupBytes,
    counts,
  };

  await ref.set({
    status: "completed",
    purgeReceipt,
    completedAt,
    uid: admin.firestore.FieldValue.delete(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  await writeAudit({
    requestId,
    actorUid: actor.auth.uid,
    subjectUid: uid,
    action: "studio_data_deletion_completed",
    detail: { purgeReceiptId: purgeReceipt.receiptId, purgeChecksum: purgeReceipt.checksum, counts },
  });

  return { ok: true, requestId, status: "completed", purgeReceipt };
});

export const getStudioDataRightsRequest = onCall(async (request) => {
  const uid = requireAuth(request).auth.uid;
  const data = asRecord(request.data);
  const requestId = requiredString(data.requestId, "requestId");
  const snapshot = await loadOwnedRequest(requestId, uid);
  const value = snapshot.data()!;
  return {
    ok: true,
    request: {
      requestId,
      type: value.type,
      status: value.status,
      subjectHash: value.subjectHash,
      restoreUntil: value.restoreUntil ?? null,
      purgeAfter: value.purgeAfter ?? null,
      packageReceipt: value.packageReceipt ?? value.backupReceipt ?? null,
      purgeReceipt: value.purgeReceipt ?? null,
    },
  };
});

export const getStudioDataExportDownload = onCall(async (request) => {
  const uid = requireAuth(request).auth.uid;
  const data = asRecord(request.data);
  const requestId = requiredString(data.requestId, "requestId");
  const snapshot = await loadOwnedRequest(requestId, uid);
  const value = snapshot.data()!;
  const packageReceipt = (value.packageReceipt ?? value.backupReceipt) as Record<string, unknown> | undefined;
  const objectPath = typeof packageReceipt?.objectPath === "string" ? packageReceipt.objectPath : "";
  const checksum = typeof packageReceipt?.checksum === "string" ? packageReceipt.checksum : "";
  if (!objectPath || !checksum) {
    throw new HttpsError("failed-precondition", "Export package is not ready.");
  }
  await assertVerifiedPackage(objectPath, checksum);
  try {
    const expiresAtMs = Date.now() + 5 * 60 * 1000;
    const [url] = await admin.storage().bucket().file(objectPath).getSignedUrl({
      action: "read",
      expires: expiresAtMs,
      responseDisposition: `attachment; filename="urai-studio-${requestId}.json"`,
      responseType: "application/json",
    });
    return {
      ok: true,
      requestId,
      checksum,
      expiresAt: new Date(expiresAtMs).toISOString(),
      url,
    };
  } catch {
    throw new HttpsError("unavailable", "Private export download signing is unavailable in this environment.");
  }
});

export const STUDIO_DATA_RIGHTS_SOURCE_CONTRACT = {
  schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
  restoreWindowDays: RESTORE_WINDOW_MS / (24 * 60 * 60 * 1000),
  purgeTargetDays: PURGE_TARGET_MS / (24 * 60 * 60 * 1000),
  collections: STUDIO_COLLECTIONS.map((entry) => ({
    collection: entry.collection,
    ownerFields: [...entry.ownerFields],
    deletion: entry.deletion,
  })),
  serverOnlyCollections: ["studioDataRightsRequests", "studioDataRightsAudit"],
  firebaseAuthDeletionOwnedBy: "central-privacy",
  productionExecutionClaimed: false,
} as const;
