import { createHash, randomUUID } from "node:crypto";
import * as admin from "firebase-admin";
import { HttpsError, onCall, onRequest, type CallableRequest } from "firebase-functions/v2/https";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { onSchedule } from "firebase-functions/v2/scheduler";

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
const EXPORT_MAX_BYTES = 16 * 1024 * 1024;
const EXPORT_DOWNLOAD_TTL_MS = 5 * 60 * 1000;
const EXPORT_PACKAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DELETION_PLAN_SCHEMA = "urai-studio-deletion-plan-v1";
const DELETION_PROGRESS_SCHEMA = "urai-studio-deletion-progress-v1";
const DELETION_BATCH_PAGES = 20;
const DELETION_FAILURE_LIMIT = 3;
const DELETION_CONTINUATION_LIMIT = 64;
// Matches the current canonical urai-privacy data.export C7 decision contract.
const EXPORT_CONSENT_POLICY_VERSION = "1.0.0";

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

async function requireCurrentExportActor(request: CallableRequest<unknown>) {
  const uid = requireAuth(request).auth.uid;
  const token = request.rawRequest?.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
  try {
    if (!token || (await admin.auth().verifyIdToken(token, true)).uid !== uid) throw new Error();
  } catch { throw new HttpsError("unauthenticated", "Current Studio export authentication is required."); }
  return uid;
}

function requireAdmin(request: CallableRequest<unknown>): AuthenticatedRequest {
  const authenticated = requireAuth(request);
  if (authenticated.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Admin authorization is required.");
  }
  return authenticated;
}

// Custom-claim removal does not itself invalidate an already-issued token.
// Pin both the current credential and the provider's current account claims.
async function requireCurrentDeletionAdmin(request: CallableRequest<unknown>) {
  const actor = requireAdmin(request);
  await requireCurrentExportActor(request);
  let current;
  try { current = await admin.auth().getUser(actor.auth.uid); }
  catch { throw new HttpsError("unauthenticated", "Current Studio deletion authentication is required."); }
  if (current.disabled || current.customClaims?.admin !== true) {
    throw new HttpsError("permission-denied", "Current Studio deletion admin authorization is required.");
  }
  return actor;
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

function stableStudioDigest(value: unknown) {
  const canonical = (entry: any): string => Array.isArray(entry) ? "[" + entry.map(canonical).join(",") + "]"
    : entry && typeof entry === "object" ? "{" + Object.entries(entry).sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => JSON.stringify(key) + ":" + canonical(child)).join(",") + "}" : JSON.stringify(entry);
  return sha256(canonical(value));
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

async function collectOwnedRecords(uid: string, deletionIdentity = false) {
  const records: Array<{ path: string; collection: string; data: unknown;
    version?: { seconds: number; nanoseconds: number }; deletion?: "delete" | "anonymize" }> = [];
  const profile = await db().collection("users").doc(uid).get();
  if (profile.exists) {
    if ((profile.data()?.uid !== undefined && profile.data()?.uid !== uid) || (profile.data()?.userId !== undefined && profile.data()?.userId !== uid)) {
      throw new HttpsError("failed-precondition", "Studio profile ownership is inconsistent.");
    }
    records.push({
      path: profile.ref.path,
      collection: "users",
      data: normalizeForJson(profile.data()),
      ...(deletionIdentity ? { version: { seconds: profile.updateTime!.seconds, nanoseconds: profile.updateTime!.nanoseconds }, deletion: "delete" as const } : {}),
    });
  }

  for (const spec of STUDIO_COLLECTIONS) {
    const documents = await queryOwned(spec, uid);
    for (const document of documents) {
      if (!spec.ownerFields.some(field => document.data()[field] === uid)
        || spec.ownerFields.some(field => document.data()[field] !== undefined && document.data()[field] !== uid)) {
        throw new HttpsError("failed-precondition", "Studio record ownership is inconsistent.");
      }
      records.push({
        path: document.ref.path,
        collection: spec.collection,
        data: normalizeForJson(document.data()),
        ...(deletionIdentity ? { version: { seconds: document.updateTime.seconds, nanoseconds: document.updateTime.nanoseconds }, deletion: spec.deletion } : {}),
      });
    }
  }

  return records.sort((left, right) => left.path.localeCompare(right.path));
}

async function writePrivatePackage(uid: string, requestId: string, kind: "export" | "deletion-backup", checkpoint?: () => Promise<void>) {
  await checkpoint?.();
  const records = await collectOwnedRecords(uid, kind === "deletion-backup");
  const deletionPlan = kind === "deletion-backup" ? { schemaVersion: DELETION_PLAN_SCHEMA, requestId,
    subjectHash: subjectHash(uid), targets: records.map(({ path, collection, deletion, version }) => ({ path, collection, deletion, version })) } : null;
  const deletionPlanHash = deletionPlan ? sha256(JSON.stringify(deletionPlan)) : null;
  const generatedAt = nowIso();
  const payload = {
    schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
    kind,
    subjectHash: subjectHash(uid),
    generatedAt,
    recordCount: records.length,
    records,
    ...(deletionPlan ? { deletionPlan } : {}),
  };
  const body = Buffer.from(JSON.stringify(payload));
  if (body.length > EXPORT_MAX_BYTES) throw new HttpsError("resource-exhausted", "Studio data package exceeds the bounded export size.");
  const checksum = sha256(body);
  const objectPath = privateObjectPath(uid, requestId);
  const file = admin.storage().bucket().file(objectPath);
  await checkpoint?.();
  await file.save(body, {
    resumable: false,
    preconditionOpts: { ifGenerationMatch: 0 },
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
  const [metadata] = await file.getMetadata();
  const generation = String(metadata.generation || "");
  if (!/^[1-9][0-9]*$/.test(generation)) throw new HttpsError("unavailable", "Studio data package identity is unavailable.");
  await checkpoint?.();
  return { generatedAt, recordCount: records.length, checksum, objectPath, bytes: body.length, generation,
    ...(deletionPlan ? { deletionPlanSchemaVersion: DELETION_PLAN_SCHEMA, deletionPlanHash, deletionTargetCount: records.length } : {}) };
}

async function assertVerifiedPackage(objectPath: string, expectedChecksum: string, generation?: string) {
  const file = admin.storage().bucket().file(objectPath, generation ? { generation } : undefined);
  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  if (!Number.isSafeInteger(size) || size < 1 || size > EXPORT_MAX_BYTES
    || (generation && String(metadata.generation) !== generation)) throw new HttpsError("failed-precondition", "Verified deletion backup identity changed.");
  const [body] = await file.download();
  const actual = sha256(body);
  if (body.length !== size || actual !== expectedChecksum) {
    throw new HttpsError("failed-precondition", "Deletion backup checksum mismatch.");
  }
  return { bytes: body.length, body };
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

export const requestStudioDataExport = onCall({ timeoutSeconds: 120, memory: "256MiB" }, async (request) => {
  const uid = await requireCurrentExportActor(request);
  const requestId = db().collection("studioDataRightsRequests").doc().id;
  const authority = await db().runTransaction(async transaction => {
    const current = await readStudioExportConsent(transaction, uid);
    transaction.create(requestRef(requestId), {
      schemaVersion: DATA_RIGHTS_SCHEMA_VERSION, requestId, uid, subjectHash: subjectHash(uid),
      type: "export", status: "preparing", privatePackageIntent: privateObjectPath(uid, requestId),
      exportConsentReceiptHash: current.receiptHash, exportConsentExpiresAt: current.expiresAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return current;
  });
  const checkpoint = async () => {
    await requireCurrentExportActor(request);
    await db().runTransaction(async transaction => {
      const current = await readStudioExportConsent(transaction, uid);
      const record = (await transaction.get(requestRef(requestId))).data();
      if (current.receiptHash !== authority.receiptHash || current.expiresAt !== authority.expiresAt
        || record?.uid !== uid || record?.type !== "export" || record?.status !== "preparing") {
        throw new HttpsError("failed-precondition", "Current Studio export preparation authority changed.");
      }
    });
  };
  const packageReceipt = await writePrivatePackage(uid, requestId, "export", checkpoint);
  await requireCurrentExportActor(request);
  await db().runTransaction(async transaction => {
    const current = await readStudioExportConsent(transaction, uid);
    const record = (await transaction.get(requestRef(requestId))).data();
    if (current.receiptHash !== authority.receiptHash || current.expiresAt !== authority.expiresAt
      || record?.uid !== uid || record?.status !== "preparing") throw new HttpsError("failed-precondition", "Current Studio export authority changed before admission.");
    transaction.set(requestRef(requestId), {
    schemaVersion: DATA_RIGHTS_SCHEMA_VERSION,
    requestId,
    uid,
    subjectHash: subjectHash(uid),
    type: "export",
    status: "ready",
    packageReceipt,
    packageExpiresAt: Math.min(Date.parse(packageReceipt.generatedAt) + EXPORT_PACKAGE_TTL_MS, authority.expiresAt),
    exportConsentReceiptHash: authority.receiptHash,
    exportConsentExpiresAt: authority.expiresAt,
    privatePackageIntent: admin.firestore.FieldValue.delete(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });
  await writeAudit({
    requestId,
    actorUid: uid,
    subjectUid: uid,
    action: "studio_data_export_ready",
    detail: { checksum: packageReceipt.checksum, recordCount: packageReceipt.recordCount },
  });
  await requireCurrentExportActor(request);
  await db().runTransaction(transaction => readStudioExportAuthority(transaction, uid, requestId));

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
  const uid = await requireCurrentExportActor(request);
  const requestId = db().collection("studioDataRightsRequests").doc().id;
  const requestedAt = Date.now();
  const restoreUntil = new Date(requestedAt + RESTORE_WINDOW_MS).toISOString();
  const purgeAfter = new Date(requestedAt + PURGE_TARGET_MS).toISOString();
  await db().runTransaction(async transaction => {
    const fence = (await transaction.get(studioOwnerFence(uid))).data();
    if (fence?.active === true || fence?.permanent === true) throw new HttpsError("failed-precondition", "A Studio deletion fence is already active.");
    await requireCurrentExportActor(request);
    transaction.set(studioOwnerFence(uid), { uid, requestId, active: true, permanent: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    transaction.create(requestRef(requestId), { schemaVersion: DATA_RIGHTS_SCHEMA_VERSION, requestId, uid,
      subjectHash: subjectHash(uid), type: "delete", status: "preparing_deletion_backup", legalHold: false,
      restoreUntil, purgeAfter, privatePackageIntent: privateObjectPath(uid, requestId),
      createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  const preparationCheckpoint = async () => {
    await requireCurrentExportActor(request);
    await db().runTransaction(async transaction => {
      const current = (await transaction.get(requestRef(requestId))).data();
      const fence = (await transaction.get(studioOwnerFence(uid))).data();
      if (current?.uid !== uid || current.status !== "preparing_deletion_backup" || current.legalHold === true
        || fence?.uid !== uid || fence.requestId !== requestId || fence.active !== true || fence.permanent !== false) {
        throw new HttpsError("failed-precondition", "Studio deletion preparation authority changed.");
      }
      await requireCurrentExportActor(request);
    });
  };
  const packageReceipt = await writePrivatePackage(uid, requestId, "deletion-backup", preparationCheckpoint);

  await db().runTransaction(async transaction => {
    const current = (await transaction.get(requestRef(requestId))).data();
    const fence = (await transaction.get(studioOwnerFence(uid))).data();
    if (current?.uid !== uid || current.status !== "preparing_deletion_backup" || current.legalHold === true || fence?.uid !== uid
      || fence.requestId !== requestId || fence.active !== true || fence.permanent !== false) {
      throw new HttpsError("failed-precondition", "Studio deletion preparation authority changed.");
    }
    await requireCurrentExportActor(request);
    transaction.set(requestRef(requestId), {
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
    privatePackageIntent: admin.firestore.FieldValue.delete(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
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
  const uid = await requireCurrentExportActor(request);
  const data = asRecord(request.data);
  const requestId = requiredString(data.requestId, "requestId");
  await db().runTransaction(async transaction => {
    const ref = requestRef(requestId), value = (await transaction.get(ref)).data();
    const fenceRef = studioOwnerFence(uid), fence = (await transaction.get(fenceRef)).data();
    if (value?.uid !== uid || value.type !== "delete" || !["pending_restore_window", "preparing_deletion_backup"].includes(String(value.status))) {
      throw new HttpsError("failed-precondition", "Deletion request cannot be cancelled in its current state.");
    }
    const restoreUntilMs = Date.parse(String(value.restoreUntil));
    if (!Number.isFinite(restoreUntilMs) || Date.now() > restoreUntilMs) throw new HttpsError("failed-precondition", "Deletion restore window has expired.");
    if (fence && (fence.uid !== uid || fence.requestId !== requestId || fence.permanent === true)) throw new HttpsError("failed-precondition", "Studio deletion fence changed.");
    await requireCurrentExportActor(request);
    transaction.set(ref, { status: "cancelled", cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    if (fence) transaction.set(fenceRef, { active: false, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  });
  await writeAudit({
    requestId,
    actorUid: uid,
    subjectUid: uid,
    action: "studio_data_deletion_cancelled",
  });
  return { ok: true, requestId, status: "cancelled" };
});

export const setStudioDataDeletionLegalHold = onCall(async (request) => {
  const actor = await requireCurrentDeletionAdmin(request);
  const data = asRecord(request.data);
  const requestId = requiredString(data.requestId, "requestId");
  const active = data.active === true;
  const reason = active ? requiredString(data.reason, "reason") : null;
  const ref = requestRef(requestId);
  const uid = await db().runTransaction(async transaction => {
    const value = (await transaction.get(ref)).data();
    if (!value || value.type !== "delete") throw new HttpsError("not-found", "Deletion request is unavailable.");
    if (value.status === "executing" || ["purging", "purged"].includes(String(value.backupPurgeState))) {
      throw new HttpsError("failed-precondition", "Studio destructive execution has already been admitted.");
    }
    await requireCurrentDeletionAdmin(request);
    transaction.set(ref, {
    legalHold: active,
    legalHoldReason: reason,
    legalHoldUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    return String(value.uid || "");
  });
  await writeAudit({
    requestId,
    actorUid: actor.auth.uid,
    subjectUid: uid,
    action: active ? "studio_data_deletion_legal_hold_set" : "studio_data_deletion_legal_hold_cleared",
    detail: active ? { reason } : {},
  });
  return { ok: true, requestId, legalHold: active };
});

type DeletionTarget = { path: string; collection: string; deletion: "delete" | "anonymize";
  version: { seconds: number; nanoseconds: number } };
type DeletionCounts = Record<string, { deleted: number; anonymized: number; observedAbsent?: number }>;
type DeletionProgress = { schemaVersion: string; nextTargetIndex: number; counts: DeletionCounts };

function readStudioDeletionPlan(body: Buffer, uid: string, requestId: string, expectedHash: unknown) {
  let payload;
  try { payload = JSON.parse(body.toString("utf8")); } catch { throw new HttpsError("failed-precondition", "Studio deletion backup plan is invalid."); }
  const plan = asRecord(payload.deletionPlan);
  if (payload.schemaVersion !== DATA_RIGHTS_SCHEMA_VERSION || payload.kind !== "deletion-backup"
    || payload.subjectHash !== subjectHash(uid) || plan.schemaVersion !== DELETION_PLAN_SCHEMA
    || plan.requestId !== requestId || plan.subjectHash !== subjectHash(uid) || !Array.isArray(plan.targets)
    || !/^[a-f0-9]{64}$/.test(String(expectedHash || "")) || sha256(JSON.stringify(plan)) !== expectedHash) {
    throw new HttpsError("failed-precondition", "Studio deletion requires its original verified versioned backup plan.");
  }
  const seen = new Set<string>(), targets: DeletionTarget[] = [];
  for (const entry of plan.targets) {
    const target = asRecord(entry), version = asRecord(target.version), path = String(target.path || ""), collection = String(target.collection || "");
    const spec = STUDIO_COLLECTIONS.find(spec => spec.collection === collection), parts = path.split("/");
    if (parts.length !== 2 || !parts[1] || parts[0] !== collection || seen.has(path)
      || (collection === "users" ? path !== `users/${uid}` || target.deletion !== "delete" : !spec || target.deletion !== spec.deletion)
      || !Number.isSafeInteger(version.seconds) || !Number.isSafeInteger(version.nanoseconds)
      || Number(version.nanoseconds) < 0 || Number(version.nanoseconds) >= 1000000000) {
      throw new HttpsError("failed-precondition", "Studio deletion backup target identity is invalid.");
    }
    seen.add(path); targets.push({ path, collection, deletion: target.deletion as "delete" | "anonymize",
      version: { seconds: Number(version.seconds), nanoseconds: Number(version.nanoseconds) } });
  }
  if (targets.some((target, index) => index > 0 && targets[index - 1].path.localeCompare(target.path) >= 0)) {
    throw new HttpsError("failed-precondition", "Studio deletion backup plan order is invalid.");
  }
  return { hash: String(expectedHash), targets };
}

function readStudioDeletionProgress(value: unknown, targetCount: number): DeletionProgress {
  if (value === undefined) return { schemaVersion: DELETION_PROGRESS_SCHEMA, nextTargetIndex: 0, counts: {} };
  const progress = asRecord(value), counts = asRecord(progress.counts);
  if (progress.schemaVersion !== DELETION_PROGRESS_SCHEMA || !Number.isSafeInteger(progress.nextTargetIndex)
    || Object.keys(progress).some(key => !["schemaVersion", "nextTargetIndex", "counts"].includes(key))
    || Number(progress.nextTargetIndex) < 0 || Number(progress.nextTargetIndex) > targetCount) {
    throw new HttpsError("failed-precondition", "Studio deletion continuation checkpoint is invalid.");
  }
  let counted = 0;
  for (const [collection, entry] of Object.entries(counts)) {
    if (collection !== "users" && !STUDIO_COLLECTIONS.some(spec => spec.collection === collection)) throw new HttpsError("failed-precondition", "Studio deletion continuation collection is invalid.");
    const count = asRecord(entry);
    if (Object.keys(count).some(key => !["deleted", "anonymized", "observedAbsent"].includes(key))) throw new HttpsError("failed-precondition", "Studio deletion continuation count fields are invalid.");
    for (const key of ["deleted", "anonymized", "observedAbsent"]) {
      const amount = count[key] ?? (key === "observedAbsent" ? 0 : undefined);
      if (!Number.isSafeInteger(amount) || Number(amount) < 0) throw new HttpsError("failed-precondition", "Studio deletion continuation counts are invalid.");
      counted += Number(amount);
    }
  }
  if (counted !== progress.nextTargetIndex) throw new HttpsError("failed-precondition", "Studio deletion continuation counts do not bind its cursor.");
  return { schemaVersion: DELETION_PROGRESS_SCHEMA, nextTargetIndex: Number(progress.nextTargetIndex), counts: counts as DeletionCounts };
}

/** Invalidate delivery before touching Storage, and delete only an observed,
 * checksum-bound generation in this owner's exact private package namespace.
 * An uncertain preparation intent stays durable for later reconciliation. */
async function purgeStudioExportPackage(requestId: string, expectedUid?: string,
  checkpoint?: (transaction?: admin.firestore.Transaction) => Promise<void>) {
  await checkpoint?.();
  const ref = requestRef(requestId);
  const before = (await ref.get()).data();
  const uid = String(before?.uid || "");
  if (!before || before.type !== "export" || (expectedUid && uid !== expectedUid)
    || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(uid) || uid.includes("..")
    || !/^[A-Za-z0-9_-]{1,160}$/.test(requestId)) return { deleted: 0, pending: 1 };
  if (before.status === "package_purged") return { deleted: 0, pending: 0 };
  const receipt = asRecord(before.packageReceipt), objectPath = privateObjectPath(uid, requestId);
  const hasReceipt = receipt.objectPath === objectPath && /^[a-f0-9]{64}$/.test(String(receipt.checksum || ""));
  if (!hasReceipt && before.privatePackageIntent !== objectPath) return { deleted: 0, pending: 1 };
  const basis = sha256(JSON.stringify(before));
  const cleanupAttemptToken = randomUUID();
  await db().runTransaction(async transaction => {
    await checkpoint?.(transaction);
    const current = (await transaction.get(ref)).data();
    if (!current || sha256(JSON.stringify(current)) !== basis) throw new HttpsError("failed-precondition", "Studio package cleanup authority changed.");
    transaction.set(ref, { status: "package_purge_pending", packageCleanupAttemptToken: cleanupAttemptToken, cleanupStartedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  });
  const currentCleanup = async (transaction: admin.firestore.Transaction) => {
    await checkpoint?.(transaction);
    const current = (await transaction.get(ref)).data();
    if (current?.uid !== uid || current.type !== "export" || current.status !== "package_purge_pending"
      || current.packageCleanupAttemptToken !== cleanupAttemptToken
      || JSON.stringify(current.packageReceipt ?? null) !== JSON.stringify(before.packageReceipt ?? null)
      || current.privatePackageIntent !== before.privatePackageIntent) {
      throw new HttpsError("failed-precondition", "Studio package cleanup attempt or generation authority changed.");
    }
    return current;
  };
  const finishCleanup = async (fields: Record<string, unknown>) => db().runTransaction(async transaction => {
    await currentCleanup(transaction);
    transaction.set(ref, fields, { merge: true });
  });
  const knownGeneration = /^[1-9][0-9]*$/.test(String(receipt.generation || "")) ? String(receipt.generation) : undefined;
  const object = admin.storage().bucket().file(objectPath, knownGeneration ? { generation: knownGeneration } : undefined);
  let metadata: { generation?: unknown; size?: unknown; metadata?: unknown };
  try { [metadata] = await object.getMetadata(); }
  catch (error) {
    if ((error as { code?: number }).code !== 404 || !hasReceipt) return { deleted: 0, pending: 1 };
    // A completed receipt cannot later publish another immutable generation.
    await finishCleanup({ status: "package_purged", packageReceipt: admin.firestore.FieldValue.delete(),
      privatePackageIntent: admin.firestore.FieldValue.delete(), packagePurgeReceipt: {
        scope: "exact_studio_export_generation", objectPathHash: sha256(objectPath), generation: knownGeneration ?? null,
        checksum: receipt.checksum, observedAbsent: true, completedAt: nowIso(), globalErasureVerified: false,
      }, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    return { deleted: 0, pending: 0 };
  }
  const generation = String(metadata.generation || ""), bytes = Number(metadata.size), tags = asRecord(metadata.metadata);
  if (!/^[1-9][0-9]*$/.test(generation) || (knownGeneration && generation !== knownGeneration)
    || !Number.isSafeInteger(bytes) || bytes < 1 || bytes > EXPORT_MAX_BYTES
    || tags.schemaVersion !== DATA_RIGHTS_SCHEMA_VERSION || tags.subjectHash !== subjectHash(uid)
    || tags.kind !== "export" || !/^[a-f0-9]{64}$/.test(String(tags.checksum || ""))
    || (hasReceipt && tags.checksum !== receipt.checksum)) return { deleted: 0, pending: 1 };
  const pinned = admin.storage().bucket().file(objectPath, { generation });
  const [body] = await pinned.download();
  if (body.length !== bytes || sha256(body) !== tags.checksum) return { deleted: 0, pending: 1 };
  await db().runTransaction(currentCleanup);
  await checkpoint?.();
  await pinned.delete({ ignoreNotFound: true, ifGenerationMatch: generation });
  await finishCleanup({ status: "package_purged", packageReceipt: admin.firestore.FieldValue.delete(),
    privatePackageIntent: admin.firestore.FieldValue.delete(), packagePurgeReceipt: {
      scope: "exact_studio_export_generation", objectPathHash: sha256(objectPath), generation, checksum: tags.checksum,
      bytes, completedAt: nowIso(), globalErasureVerified: false,
    }, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return { deleted: 1, pending: 0 };
}

async function purgeOwnedStudioExportPackages(uid: string, checkpoint?: (transaction?: admin.firestore.Transaction) => Promise<void>) {
  let cursor: admin.firestore.QueryDocumentSnapshot | undefined, deleted = 0, pending = 0;
  for (;;) {
    let query = db().collection("studioDataRightsRequests").where("uid", "==", uid)
      .orderBy(admin.firestore.FieldPath.documentId()).limit(PAGE_SIZE);
    if (cursor) query = query.startAfter(cursor);
    const snapshot = await query.get();
    for (const document of snapshot.docs) {
      if (document.data().type !== "export") continue;
      try { const result = await purgeStudioExportPackage(document.id, uid, checkpoint); deleted += result.deleted; pending += result.pending; }
      catch { pending++; }
    }
    if (snapshot.size < PAGE_SIZE) break;
    cursor = snapshot.docs[snapshot.docs.length - 1];
  }
  return { scope: "known_studio_export_generations", deleted, pending, globalErasureVerified: false };
}

async function purgeStudioDeletionBackup(requestId: string, before: Record<string, unknown>) {
  if (!["completed", "cancelled"].includes(String(before.status)) || before.legalHold === true
    || !Number.isFinite(Date.parse(String(before.purgeAfter))) || Date.now() < Date.parse(String(before.purgeAfter))
    || before.backupPurgeState === "purged") return;
  const receipt = asRecord(before.backupReceipt);
  const objectPath = String(receipt.objectPath || before.privatePackageIntent || "");
  const path = /^private\/data-rights\/studio\/([A-Za-z0-9][A-Za-z0-9._:-]{0,127})\/([A-Za-z0-9_-]{1,160})\.json$/.exec(objectPath);
  if (!path || path[1].includes("..") || path[2] !== requestId || before.subjectHash !== subjectHash(path[1])) return;
  const generation = /^[1-9][0-9]*$/.test(String(receipt.generation || "")) ? String(receipt.generation) : undefined;
  const file = admin.storage().bucket().file(objectPath, generation ? { generation } : undefined);
  let metadata: { generation?: unknown; size?: unknown; metadata?: unknown };
  try { [metadata] = await file.getMetadata(); } catch (error) {
    if ((error as { code?: number }).code === 404 && generation && before.backupPurgeState === "purging") {
      await requestRef(requestId).set({ backupPurgeState: "purged", backupReceipt: admin.firestore.FieldValue.delete(),
        privatePackageIntent: admin.firestore.FieldValue.delete(), backupPurgeReceipt: {
          scope: "exact_studio_deletion_backup_generation", objectPathHash: sha256(objectPath), generation,
          checksum: receipt.checksum, observedAbsent: true, completedAt: nowIso(), globalErasureVerified: false,
        }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    }
    return;
  }
  const observed = String(metadata.generation || ""), tags = asRecord(metadata.metadata), size = Number(metadata.size);
  if (!/^[1-9][0-9]*$/.test(observed) || (generation && generation !== observed)
    || tags.schemaVersion !== DATA_RIGHTS_SCHEMA_VERSION || tags.subjectHash !== subjectHash(path[1]) || tags.kind !== "deletion-backup"
    || !/^[a-f0-9]{64}$/.test(String(tags.checksum || "")) || (receipt.checksum && tags.checksum !== receipt.checksum)
    || !Number.isSafeInteger(size) || size < 1 || size > EXPORT_MAX_BYTES) return;
  const pinned = admin.storage().bucket().file(objectPath, { generation: observed });
  const [body] = await pinned.download(); if (body.length !== size || sha256(body) !== tags.checksum) return;
  const ref = requestRef(requestId);
  await db().runTransaction(async transaction => {
    const current = (await transaction.get(ref)).data();
    if (!current || current.type !== "delete" || !["completed", "cancelled"].includes(String(current.status))
      || current.legalHold === true || current.purgeAfter !== before.purgeAfter || Date.now() < Date.parse(String(current.purgeAfter))
      || JSON.stringify(current.backupReceipt ?? null) !== JSON.stringify(before.backupReceipt ?? null)
      || current.privatePackageIntent !== before.privatePackageIntent) throw new HttpsError("failed-precondition", "Studio backup purge authority changed.");
    transaction.set(ref, { backupPurgeState: "purging", updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  });
  await pinned.delete({ ignoreNotFound: true, ifGenerationMatch: observed });
  await ref.set({ backupPurgeState: "purged", backupReceipt: admin.firestore.FieldValue.delete(),
    privatePackageIntent: admin.firestore.FieldValue.delete(), backupPurgeReceipt: {
      scope: "exact_studio_deletion_backup_generation", objectPathHash: sha256(objectPath), generation: observed,
      checksum: tags.checksum, bytes: size, completedAt: nowIso(), globalErasureVerified: false,
    }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
}

// A rotating server-owned cursor bounds every run without starving later
// packages behind still-valid exports. Byte authority expires independently.
export const reconcileStudioDataExportPackages = onSchedule({ schedule: "every 15 minutes", timeoutSeconds: 540, memory: "256MiB" }, async () => {
  const cursorRef = db().collection("studioDataRightsMaintenance").doc("exportPackages");
  const cursor = (await cursorRef.get()).data()?.cursor;
  let query = db().collection("studioDataRightsRequests")
    .orderBy(admin.firestore.FieldPath.documentId()).limit(50);
  if (typeof cursor === "string" && /^[A-Za-z0-9_-]{1,160}$/.test(cursor)) query = query.startAfter(cursor);
  const snapshot = await query.get();
  for (const document of snapshot.docs) {
    const value = document.data();
    if (value.type === "delete") { try { await purgeStudioDeletionBackup(document.id, value); } catch { /* Retain the known backup intent on uncertainty. */ } continue; }
    if (value.type !== "export") continue;
    if (value.status === "package_purged") continue;
    let eligible = value.status === "package_purge_pending";
    if (value.status === "preparing") {
      const createdAt = exportMillis(value.createdAt);
      eligible = createdAt !== null && Date.now() >= createdAt + 15 * 60 * 1000;
    } else if (value.status === "ready") {
      try { await db().runTransaction(transaction => readStudioExportAuthority(transaction, String(value.uid || ""), document.id)); }
      catch (error) { eligible = error instanceof HttpsError && error.code === "failed-precondition"; }
    }
    if (eligible) { try { await purgeStudioExportPackage(document.id); } catch { /* Durable pending intent is retried on the next rotation. */ } }
  }
  await cursorRef.set({ cursor: snapshot.size === 50 ? snapshot.docs[snapshot.docs.length - 1].id : null,
    updatedAt: admin.firestore.FieldValue.serverTimestamp() });
});

export const executeStudioDataDeletion = onCall({ timeoutSeconds: 540, memory: "256MiB" }, async request => {
  const actor = await requireCurrentDeletionAdmin(request);
  const requestId = requiredString(asRecord(request.data).requestId, "requestId"), ref = requestRef(requestId);
  const snapshot = await ref.get(), value = snapshot.data();
  if (!snapshot.exists || value?.type !== "delete") throw new HttpsError("not-found", "Deletion request is unavailable.");
  if (value.status === "completed") {
    const receipt = asRecord(value.purgeReceipt);
    if (receipt.schemaVersion !== DELETION_PLAN_SCHEMA || receipt.subjectHash !== value.subjectHash
      || receipt.deletionPlanHash !== value.deletionPlanHash || receipt.requestId !== requestId
      || !/^[a-f0-9]{64}$/.test(String(value.deletionPlanHash || ""))
      || value.purgeReceiptDigest !== stableStudioDigest(receipt)) {
      throw new HttpsError("failed-precondition", "Retained Studio deletion receipt requires reconciliation.");
    }
    await requireCurrentDeletionAdmin(request);
    return { ok: true, requestId, status: "completed", purgeReceipt: receipt, replay: true };
  }
  const uid = String(value.uid || "");
  if (!uid || !["pending_restore_window", "executing", "execution_retryable", "execution_continuation_required"].includes(String(value.status))) {
    throw new HttpsError("failed-precondition", "Deletion request is not executable in its current state.");
  }
  if (value.legalHold === true) throw new HttpsError("failed-precondition", "Deletion request is blocked by an active legal hold.");
  if (!Number.isFinite(Date.parse(String(value.restoreUntil))) || Date.now() < Date.parse(String(value.restoreUntil))) {
    throw new HttpsError("failed-precondition", "Deletion restore window is still active.");
  }
  const backup = asRecord(value.backupReceipt), objectPath = String(backup.objectPath || ""), backupChecksum = String(backup.checksum || "");
  const backupGeneration = String(backup.generation || "");
  if (objectPath !== privateObjectPath(uid, requestId) || !/^[a-f0-9]{64}$/.test(backupChecksum)
    || !/^[1-9][0-9]*$/.test(backupGeneration) || backup.deletionPlanSchemaVersion !== DELETION_PLAN_SCHEMA) {
    throw new HttpsError("failed-precondition", "Deletion requires a fresh governed backup with its original versioned plan.");
  }
  const verified = await assertVerifiedPackage(objectPath, backupChecksum, backupGeneration), backupBytes = verified.bytes;
  const plan = readStudioDeletionPlan(verified.body, uid, requestId, backup.deletionPlanHash);
  if (backup.deletionTargetCount !== plan.targets.length) throw new HttpsError("failed-precondition", "Studio deletion backup target count changed.");
  const executionAttemptToken = randomUUID(), executionLeaseExpiresAt = Date.now() + 15 * 60 * 1000;
  const counter = (entry: unknown) => {
    if (entry === undefined) return 0;
    if (!Number.isSafeInteger(entry) || Number(entry) < 0) throw new HttpsError("failed-precondition", "Studio deletion retry budget is invalid.");
    return Number(entry);
  };
  await requireCurrentDeletionAdmin(request);
  let progress = await db().runTransaction(async transaction => {
    const current = (await transaction.get(ref)).data(), fenceRef = studioOwnerFence(uid), fence = (await transaction.get(fenceRef)).data();
    if (current?.uid !== uid || current.type !== "delete"
      || current.subjectHash !== subjectHash(uid)
      || !["pending_restore_window", "executing", "execution_retryable", "execution_continuation_required"].includes(String(current.status))
      || current.legalHold === true || current.restoreUntil !== value.restoreUntil || Date.now() < Date.parse(String(current.restoreUntil))
      || current.backupReceipt?.objectPath !== objectPath || current.backupReceipt?.checksum !== backupChecksum
      || current.backupReceipt?.generation !== backupGeneration || current.backupReceipt?.deletionPlanHash !== plan.hash
      || current.backupReceipt?.deletionPlanSchemaVersion !== DELETION_PLAN_SCHEMA || current.backupReceipt?.deletionTargetCount !== plan.targets.length
      || (current.deletionPlanHash !== undefined && current.deletionPlanHash !== plan.hash)
      || fence?.uid !== uid || fence.requestId !== requestId || fence.active !== true
      || (current.status !== "pending_restore_window" && fence.permanent !== true)) {
      throw new HttpsError("failed-precondition", "Current Studio deletion authority changed during backup verification.");
    }
    const interrupted = current.status === "executing";
    if (interrupted && (!Number.isSafeInteger(current.executionLeaseExpiresAt) || current.executionLeaseExpiresAt > Date.now())) {
      throw new HttpsError("unavailable", "The exact Studio deletion attempt is still in progress.");
    }
    if (current.status !== "pending_restore_window" && current.deletionPlanHash !== plan.hash) {
      throw new HttpsError("failed-precondition", "Studio interruption lacks its original bound deletion plan.");
    }
    const failures = counter(current.deletionFailureAttempts) + (interrupted ? 1 : 0), continuations = counter(current.deletionContinuationDeliveries);
    if (failures >= DELETION_FAILURE_LIMIT || continuations >= DELETION_CONTINUATION_LIMIT) {
      throw new HttpsError("resource-exhausted", "Studio deletion retry or continuation budget requires reconciliation.");
    }
    const retained = readStudioDeletionProgress(current.deletionProgress, plan.targets.length);
    await requireCurrentDeletionAdmin(request);
    transaction.set(fenceRef, { uid, requestId, active: true, permanent: true, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    transaction.set(ref, { status: "executing", executionAttemptToken, executionLeaseExpiresAt,
      deletionPlanHash: plan.hash, deletionTargetCount: plan.targets.length, deletionProgress: retained,
      deletionFailureAttempts: failures, deletionContinuationDeliveries: continuations,
      executionAttemptNumber: counter(current.executionAttemptNumber) + 1,
      executionStartedAt: admin.firestore.FieldValue.serverTimestamp(), executedByHash: subjectHash(actor.auth.uid),
      updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    return retained;
  });
  const currentExecution = async (transaction: admin.firestore.Transaction) => {
    const current = (await transaction.get(ref)).data(), fence = (await transaction.get(studioOwnerFence(uid))).data();
    if (current?.uid !== uid || current.type !== "delete" || current.status !== "executing"
      || current.subjectHash !== subjectHash(uid) || current.restoreUntil !== value.restoreUntil
      || current.executionAttemptToken !== executionAttemptToken || current.executionLeaseExpiresAt !== executionLeaseExpiresAt
      || Date.now() >= executionLeaseExpiresAt || current.executedByHash !== subjectHash(actor.auth.uid) || current.legalHold === true
      || current.backupReceipt?.objectPath !== objectPath || current.backupReceipt?.checksum !== backupChecksum
      || current.backupReceipt?.generation !== backupGeneration || current.backupReceipt?.deletionPlanHash !== plan.hash
      || current.backupReceipt?.deletionPlanSchemaVersion !== DELETION_PLAN_SCHEMA || current.backupReceipt?.deletionTargetCount !== plan.targets.length
      || current.deletionPlanHash !== plan.hash || current.deletionTargetCount !== plan.targets.length
      || stableStudioDigest(readStudioDeletionProgress(current.deletionProgress, plan.targets.length)) !== stableStudioDigest(progress)
      || fence?.uid !== uid || fence.requestId !== requestId || fence.active !== true || fence.permanent !== true) {
      throw new HttpsError("failed-precondition", "Current Studio deletion execution or continuation authority changed.");
    }
    await requireCurrentDeletionAdmin(request);
    return current;
  };
  const checkpoint = async (transaction?: admin.firestore.Transaction) => { if (transaction) await currentExecution(transaction); else await db().runTransaction(currentExecution); };
  const continueExecution = async (reason: string) => {
    await db().runTransaction(async transaction => {
      const current = await currentExecution(transaction);
      transaction.set(ref, { status: "execution_continuation_required", executionLeaseExpiresAt: 0,
        executionAttemptToken: admin.firestore.FieldValue.delete(), deletionContinuationReason: reason,
        deletionContinuationDeliveries: counter(current.deletionContinuationDeliveries) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });
    return { ok: true, requestId, status: "execution_continuation_required", progress, globalErasureVerified: false };
  };
  try {
    await checkpoint();
    const cleanup = await purgeOwnedStudioExportPackages(uid, checkpoint);
    const privatePackageCleanup = await db().runTransaction(async transaction => {
      const current = await currentExecution(transaction), prior = asRecord(current.deletionPrivatePackageCleanup);
      const retained = { ...cleanup, deleted: Number(prior.deleted || 0) + cleanup.deleted };
      transaction.set(ref, { deletionPrivatePackageCleanup: retained }, { merge: true }); return retained;
    });
    if (privatePackageCleanup.pending) return await continueExecution("exact_export_generation_cleanup_pending");
    for (let page = 0; page < DELETION_BATCH_PAGES && progress.nextTargetIndex < plan.targets.length; page++) {
      const next = await db().runTransaction(async transaction => {
        await currentExecution(transaction);
        const slice = plan.targets.slice(progress.nextTargetIndex, progress.nextTargetIndex + 400), targets = [];
        const counts: DeletionCounts = JSON.parse(JSON.stringify(progress.counts));
        const snapshots = await transaction.getAll(...slice.map(entry => db().doc(entry.path)));
        for (const [index, entry] of slice.entries()) {
          const current = snapshots[index];
          counts[entry.collection] ??= { deleted: 0, anonymized: 0 };
          if (!current.exists) { counts[entry.collection].observedAbsent = (counts[entry.collection].observedAbsent || 0) + 1; continue; }
          const fields = current.data()!, spec = STUDIO_COLLECTIONS.find(spec => spec.collection === entry.collection);
          const owned = entry.collection === "users" ? entry.path === `users/${uid}` && (!fields.uid || fields.uid === uid) && (!fields.userId || fields.userId === uid)
            : !!spec && spec.ownerFields.some(field => fields[field] === uid) && spec.ownerFields.every(field => !fields[field] || fields[field] === uid);
          if (!owned || !current.updateTime?.isEqual(new admin.firestore.Timestamp(entry.version.seconds, entry.version.nanoseconds))) {
            throw new HttpsError("failed-precondition", "Studio deletion original target ownership or exact version changed.");
          }
          targets.push({ entry, current }); counts[entry.collection][entry.deletion === "anonymize" ? "anonymized" : "deleted"]++;
        }
        await requireCurrentDeletionAdmin(request);
        for (const { entry, current } of targets) {
          if (entry.deletion === "anonymize") transaction.set(current.ref, { schemaVersion: "urai-studio-anonymized-audit-v1",
            subjectHash: subjectHash(uid), eventRetainedForAudit: true, anonymizedAt: admin.firestore.FieldValue.serverTimestamp() });
          else transaction.delete(current.ref, { lastUpdateTime: current.updateTime! });
        }
        const next = { schemaVersion: DELETION_PROGRESS_SCHEMA, nextTargetIndex: progress.nextTargetIndex + slice.length, counts };
        transaction.set(ref, { deletionProgress: next, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
        return next;
      });
      progress = next;
    }
    if (progress.nextTargetIndex < plan.targets.length) return await continueExecution("bounded_original_target_plan_remaining");
    const completedAt = nowIso(), counts = progress.counts;
    const receiptBasis = JSON.stringify({ schemaVersion: DELETION_PLAN_SCHEMA, requestId, subjectHash: subjectHash(uid),
      deletionPlanHash: plan.hash, backupChecksum, counts, privatePackageCleanup,
      scope: "owned_studio_firestore_records_and_known_export_generations", globalErasureVerified: false, completedAt });
    const purgeReceipt = { schemaVersion: DELETION_PLAN_SCHEMA, requestId, subjectHash: subjectHash(uid), deletionPlanHash: plan.hash,
      receiptId: `studio_purge_${sha256(receiptBasis).slice(0, 32)}`, checksum: sha256(receiptBasis), completedAt,
      backupChecksum, backupBytes, counts, privatePackageCleanup, scope: "owned_studio_firestore_records_and_known_export_generations", globalErasureVerified: false };
    // Every original target participates in the completion transaction. Normal
    // late writers must also honor the permanent owner fence; a residual or new
    // owned row cannot become a success receipt.
    await db().runTransaction(async transaction => {
      await currentExecution(transaction);
      for (let offset = 0; offset < plan.targets.length; offset += 400) {
        const entries = plan.targets.slice(offset, offset + 400), snapshots = await transaction.getAll(...entries.map(entry => db().doc(entry.path)));
        for (const [index, entry] of entries.entries()) {
        const current = snapshots[index];
        if (!current.exists) continue;
        const data = current.data()!;
        if (entry.deletion !== "anonymize" || data.schemaVersion !== "urai-studio-anonymized-audit-v1"
          || data.subjectHash !== subjectHash(uid) || data.eventRetainedForAudit !== true
          || Object.keys(data).some(key => !["schemaVersion", "subjectHash", "eventRetainedForAudit", "anonymizedAt"].includes(key))) {
          throw new HttpsError("failed-precondition", "Studio original target has a residual or restored version.");
        }
        }
      }
      for (const spec of STUDIO_COLLECTIONS) for (const field of spec.ownerFields) {
        if ((await transaction.get(db().collection(spec.collection).where(field, "==", uid).limit(1))).size) {
          throw new HttpsError("failed-precondition", "Studio deletion has newly admitted owned records.");
        }
      }
      await requireCurrentDeletionAdmin(request);
      transaction.set(ref, { status: "completed", purgeReceipt, purgeReceiptDigest: stableStudioDigest(purgeReceipt), completedAt,
        executionAttemptToken: admin.firestore.FieldValue.delete(), executionLeaseExpiresAt: 0,
        uid: admin.firestore.FieldValue.delete(), updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });
    await writeAudit({ requestId, actorUid: actor.auth.uid, subjectUid: uid, action: "studio_data_deletion_completed",
      detail: { purgeReceiptId: purgeReceipt.receiptId, purgeChecksum: purgeReceipt.checksum, deletionPlanHash: plan.hash, counts } });
    await requireCurrentDeletionAdmin(request);
    return { ok: true, requestId, status: "completed", purgeReceipt, replay: false };
  } catch (error) {
    // Never rewrite a changed operation or a successor. Keep the transactionally
    // committed original cursor/counts so ambiguous commits and interruption are
    // recoverable without collecting a new target list.
    await db().runTransaction(async transaction => {
      const current = (await transaction.get(ref)).data();
      if (current?.uid !== uid || current.status !== "executing" || current.executionAttemptToken !== executionAttemptToken
        || current.deletionPlanHash !== plan.hash || current.backupReceipt?.checksum !== backupChecksum) return;
      transaction.set(ref, { status: "execution_retryable", executionAttemptToken: admin.firestore.FieldValue.delete(),
        executionLeaseExpiresAt: 0, deletionFailureAttempts: counter(current.deletionFailureAttempts) + 1,
        updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    });
    throw error;
  }
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

function exportMillis(value: unknown): number | null {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") { const n = Date.parse(value); return Number.isFinite(n) ? n : null; }
  if (value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function") {
    try { const n = value.toMillis(); return Number.isFinite(n) ? n : null; } catch { return null; }
  }
  return null;
}
function studioOwnerFence(uid: string) {
  return db().collection("studioDataRightsOwnerFences").doc(subjectHash(uid));
}
async function readStudioExportConsent(transaction: admin.firestore.Transaction, uid: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(uid) || uid.includes("..")) throw new HttpsError("failed-precondition", "Studio export subject is invalid.");
  const [consentSnapshot, deletionSnapshot, studioSnapshot] = await Promise.all([
    transaction.get(db().collection("consentRecords").doc(`${uid}_data_export`)),
    transaction.get(db().collection("privacyDeletionTombstones").doc(uid)),
    transaction.get(studioOwnerFence(uid)),
  ]);
  const consent = consentSnapshot.data(), fence = deletionSnapshot.data(), local = studioSnapshot.data();
  const expiresAt = exportMillis(consent?.expiresAt);
  if (!consent || consent.uid !== uid || consent.purpose !== "data.export" || consent.consentTier !== "C7"
    || consent.status !== "granted" || consent.policyVersion !== EXPORT_CONSENT_POLICY_VERSION
    || !/^[a-f0-9]{64}$/.test(String(consent.receiptHash || "")) || expiresAt === null || expiresAt <= Date.now()
    || !fence || fence.uid !== uid || fence.active === true || fence.exportConsentStatus !== "granted"
    || fence.exportConsentReceiptHash !== consent.receiptHash || fence.exportConsentPolicyVersion !== EXPORT_CONSENT_POLICY_VERSION
    || exportMillis(fence.exportConsentExpiresAt) !== expiresAt
    || (studioSnapshot.exists && (local?.uid !== uid || local.active !== false || local.permanent !== false))) {
    throw new HttpsError("failed-precondition", "Current canonical Studio export consent or deletion authority is unavailable.");
  }
  return { receiptHash: String(consent.receiptHash), expiresAt };
}
async function readStudioExportAuthority(transaction: admin.firestore.Transaction, uid: string, requestId: string) {
  if (!/^[A-Za-z0-9_-]{1,160}$/.test(requestId)) throw new HttpsError("invalid-argument", "A valid Studio export request is required.");
  const current = await readStudioExportConsent(transaction, uid);
  const snapshot = await transaction.get(requestRef(requestId)), value = snapshot.data();
  const receipt = asRecord(value?.packageReceipt);
  const bytes = Number(receipt.bytes), generatedAt = exportMillis(receipt.generatedAt);
  const packageExpiresAt = exportMillis(value?.packageExpiresAt);
  if (!value || value.schemaVersion !== DATA_RIGHTS_SCHEMA_VERSION || value.uid !== uid || value.subjectHash !== subjectHash(uid)
    || value.type !== "export" || value.status !== "ready" || value.exportConsentReceiptHash !== current.receiptHash
    || exportMillis(value.exportConsentExpiresAt) !== current.expiresAt || receipt.objectPath !== privateObjectPath(uid, requestId)
    || !/^[a-f0-9]{64}$/.test(String(receipt.checksum || "")) || !/^[1-9][0-9]*$/.test(String(receipt.generation || ""))
    || !Number.isSafeInteger(bytes) || bytes < 1 || bytes > EXPORT_MAX_BYTES || generatedAt === null || generatedAt > Date.now()
    || packageExpiresAt === null || packageExpiresAt !== Math.min(generatedAt + EXPORT_PACKAGE_TTL_MS, current.expiresAt)
    || packageExpiresAt <= Date.now()) throw new HttpsError("failed-precondition", "Current Studio export receipt is unavailable. Prepare a new export with current canonical consent.");
  const identityHash = sha256(JSON.stringify({ uid, requestId, receipt, packageExpiresAt,
    consentReceiptHash: current.receiptHash, consentExpiresAt: current.expiresAt }));
  return { uid, requestId, receipt, bytes, packageExpiresAt, consentExpiresAt: current.expiresAt, identityHash };
}
async function verifiedStudioExportBody(authority: Awaited<ReturnType<typeof readStudioExportAuthority>>) {
  const object = admin.storage().bucket().file(String(authority.receipt.objectPath), { generation: String(authority.receipt.generation) });
  const [metadata] = await object.getMetadata();
  if (String(metadata.generation) !== authority.receipt.generation || Number(metadata.size) !== authority.bytes) {
    throw new HttpsError("failed-precondition", "Studio export object identity changed.");
  }
  const [body] = await object.download();
  if (body.length !== authority.bytes || body.length > EXPORT_MAX_BYTES || sha256(body) !== authority.receipt.checksum) {
    throw new HttpsError("failed-precondition", "Studio export checksum mismatch.");
  }
  return body;
}
function studioExportEndpoint(rawHost?: string) {
  const projectId = admin.app().options.projectId || process.env.GCLOUD_PROJECT;
  if (!projectId || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(projectId)) throw new HttpsError("failed-precondition", "The current Studio Firebase project is unavailable.");
  if (process.env.FUNCTIONS_EMULATOR === "true") {
    if (!rawHost || !/^(?:localhost|127\.0\.0\.1):[0-9]{2,5}$/.test(rawHost)) throw new HttpsError("failed-precondition", "The current Studio emulator endpoint is unavailable.");
    return `http://${rawHost}/${projectId}/us-central1/downloadStudioDataExport`;
  }
  return `https://us-central1-${projectId}.cloudfunctions.net/downloadStudioDataExport`;
}

export const getStudioDataExportDownload = onCall(async (request) => {
  const uid = await requireCurrentExportActor(request), requestId = requiredString(asRecord(request.data).requestId, "requestId");
  const authority = await db().runTransaction(transaction => readStudioExportAuthority(transaction, uid, requestId));
  await verifiedStudioExportBody(authority);
  await requireCurrentExportActor(request);
  const expiresAtMs = Math.min(Date.now() + EXPORT_DOWNLOAD_TTL_MS, authority.packageExpiresAt, authority.consentExpiresAt);
  const url = new URL(studioExportEndpoint(request.rawRequest?.get("host")));
  url.searchParams.set("requestId", requestId); url.searchParams.set("expiresAt", String(expiresAtMs));
  url.searchParams.set("authorityHash", authority.identityHash);
  await db().runTransaction(async transaction => {
    const current = await readStudioExportAuthority(transaction, uid, requestId);
    if (current.identityHash !== authority.identityHash || expiresAtMs <= Date.now()) throw new HttpsError("failed-precondition", "Studio export authority changed before delivery preparation.");
  });
  return { ok: true, requestId, checksum: authority.receipt.checksum, requiresAuthorization: true,
    expiresAt: new Date(expiresAtMs).toISOString(), downloadExpiresAt: expiresAtMs,
    packageExpiresAt: authority.packageExpiresAt, url: url.toString() };
});

function allowedStudioExportOrigin(origin: string): boolean {
  const projectId = admin.app().options.projectId || process.env.GCLOUD_PROJECT;
  if (!projectId || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(projectId)) return false;
  let url: URL;
  try { url = new URL(origin); } catch { return false; }
  if (url.origin !== origin || url.protocol !== "https:" || url.port || url.username || url.password) return false;
  return ["https://uraistudio.com", "https://www.uraistudio.com", `https://${projectId}.web.app`,
    `https://${projectId}.firebaseapp.com`].includes(origin)
    || new RegExp(`^${projectId}--[a-z0-9-]+\\.web\\.app$`).test(url.hostname);
}

export const downloadStudioDataExport = onRequest({ cors: false, timeoutSeconds: 540, memory: "256MiB" }, async (request, response) => {
  response.set({ "Cache-Control": "private, no-store, max-age=0", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" });
  const origin = request.get("origin");
  response.set("Vary", "Origin");
  if ((origin && !allowedStudioExportOrigin(origin)) || (request.method === "OPTIONS" && !origin)) {
    response.status(403).json({ error: "studio_export_download_unavailable" }); return;
  }
  if (origin) response.set("Access-Control-Allow-Origin", origin);
  if (request.method === "OPTIONS") {
    const headers = request.get("access-control-request-headers")?.split(",").map(header => header.trim().toLowerCase());
    if (request.get("access-control-request-method") !== "GET" || headers?.length !== 1 || headers[0] !== "authorization") {
      response.status(400).json({ error: "studio_export_download_unavailable" }); return;
    }
    response.set({ "Access-Control-Allow-Methods": "GET", "Access-Control-Allow-Headers": "Authorization" }).status(204).end();
    return;
  }
  if (request.method !== "GET") { response.set("Allow", "GET").status(405).json({ error: "method_not_allowed" }); return; }
  try {
    const token = request.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!token) throw new HttpsError("unauthenticated", "Current authentication is required.");
    const verify = async () => {
      try { return await admin.auth().verifyIdToken(token, true); }
      catch { throw new HttpsError("unauthenticated", "Current authentication is required."); }
    };
    const actor = await verify();
    if (Object.keys(request.query).some(key => !["requestId", "expiresAt", "authorityHash"].includes(key))) throw new HttpsError("invalid-argument", "A valid Studio export request is required.");
    const requestId = requiredString(request.query.requestId, "requestId"), authorityHash = requiredString(request.query.authorityHash, "authorityHash");
    const expiresAt = typeof request.query.expiresAt === "string" ? Number(request.query.expiresAt) : NaN;
    const authority = await db().runTransaction(transaction => readStudioExportAuthority(transaction, actor.uid, requestId));
    if (!/^[a-f0-9]{64}$/.test(authorityHash) || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()
      || expiresAt > Math.min(Date.now() + EXPORT_DOWNLOAD_TTL_MS, authority.packageExpiresAt, authority.consentExpiresAt)
      || authorityHash !== authority.identityHash) throw new HttpsError("failed-precondition", "Studio export download authority expired or changed.");
    const body = await verifiedStudioExportBody(authority);
    const check = async () => {
      const currentActor = await verify();
      if (currentActor.uid !== actor.uid) throw new HttpsError("permission-denied", "Studio export subject changed.");
      const current = await db().runTransaction(transaction => readStudioExportAuthority(transaction, actor.uid, requestId));
      const finalActor = await verify();
      if (finalActor.uid !== actor.uid) throw new HttpsError("permission-denied", "Studio export subject changed.");
      if (current.identityHash !== authorityHash || expiresAt <= Date.now()) throw new HttpsError("failed-precondition", "Current Studio export download authority changed.");
    };
    await check();
    response.set({ "Content-Type": "application/json", "Content-Disposition": `attachment; filename="urai-studio-${requestId}.json"` });
    const stream = Readable.from((async function* () {
      for (let offset = 0; offset < body.length; offset += 64 * 1024) { await check(); yield body.subarray(offset, offset + 64 * 1024); }
      await check();
    })(), { objectMode: false });
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), Math.max(1, expiresAt - Date.now()));
    timer.unref?.();
    const close = () => { if (!response.writableFinished) controller.abort(); };
    response.once("close", close);
    try { await pipeline(stream, response, { signal: controller.signal }); }
    finally { clearTimeout(timer); response.removeListener("close", close); }
  } catch (error) {
    if (response.headersSent || response.destroyed) return;
    const status = error instanceof HttpsError ? ({ unauthenticated: 401, "permission-denied": 403, "not-found": 404,
      "invalid-argument": 400, "failed-precondition": 409 } as Record<string, number>)[error.code] ?? 500 : 500;
    response.status(status).json({ error: "studio_export_download_unavailable" });
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
  serverOnlyCollections: ["studioDataRightsRequests", "studioDataRightsAudit", "studioDataRightsOwnerFences", "studioDataRightsMaintenance"],
  firebaseAuthDeletionOwnedBy: "central-privacy",
  productionExecutionClaimed: false,
} as const;

