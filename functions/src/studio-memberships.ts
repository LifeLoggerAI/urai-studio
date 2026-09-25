import { createHash } from "node:crypto";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const roles = ["owner", "admin", "editor", "reviewer", "viewer"] as const;
const statuses = ["active", "suspended", "revoked"] as const;
const MEMBERSHIP_SCHEMA_VERSION = 2;

type StudioRole = (typeof roles)[number];
type MembershipStatus = (typeof statuses)[number];
type MembershipAction = "upsert" | "remove";

function requireAuth(context: functions.https.CallableContext) {
  if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Authentication is required.");
  return context.auth;
}

function requireMembershipMutationsOpen() {
  if (process.env.URAI_STUDIO_MEMBERSHIP_MUTATIONS_FROZEN === "true") {
    throw new functions.https.HttpsError("unavailable", "Studio membership mutations are temporarily frozen for an approved authority migration.");
  }
}

function requireDocumentSegment(value: unknown, field: string, maxBytes = 256): string {
  if (typeof value !== "string") throw new functions.https.HttpsError("invalid-argument", `${field} is required.`);
  const normalized = value;
  if (!normalized || normalized.trim() !== normalized || normalized === "." || normalized === ".." || normalized.includes("/") || Buffer.byteLength(normalized, "utf8") > maxBytes) {
    throw new functions.https.HttpsError("invalid-argument", `${field} is not a valid document identifier.`);
  }
  return normalized;
}

function requireRole(value: unknown): StudioRole {
  if (!roles.includes(value as StudioRole)) throw new functions.https.HttpsError("invalid-argument", "Unsupported Studio role.");
  return value as StudioRole;
}

function requireStatus(value: unknown): MembershipStatus {
  if (!statuses.includes(value as MembershipStatus)) throw new functions.https.HttpsError("invalid-argument", "Unsupported membership status.");
  return value as MembershipStatus;
}

function requireAction(value: unknown): MembershipAction {
  if (value !== "upsert" && value !== "remove") throw new functions.https.HttpsError("invalid-argument", "action must be upsert or remove.");
  return value;
}

function studioName(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 160) : "URAI Studio";
}

function operationId(...parts: string[]) {
  return createHash("sha256").update(parts.join("\u0000")).digest("hex");
}

function priorRequestResult(snapshot: admin.firestore.DocumentSnapshot, requestFingerprint: string) {
  const prior = snapshot.data();
  if (prior?.requestFingerprint !== requestFingerprint) {
    throw new functions.https.HttpsError("already-exists", "requestId was already used for a different operation payload.");
  }
  return prior.result;
}

function membershipRef(studioId: string, uid: string) {
  return db.collection("studios").doc(studioId).collection("members").doc(uid);
}

function requireCanonicalMembership(data: admin.firestore.DocumentData | undefined, uid: string, studioId: string) {
  if (!data || data.uid !== uid || data.studioId !== studioId || data.schemaVersion !== MEMBERSHIP_SCHEMA_VERSION || !roles.includes(data.role as StudioRole) || !statuses.includes(data.status as MembershipStatus)) {
    throw new functions.https.HttpsError("permission-denied", "Canonical Studio membership is required.");
  }
  return data;
}

export const createStudioTenant = functions.https.onCall(async (data, context) => {
  requireMembershipMutationsOpen();
  const auth = requireAuth(context);
  const actorUid = requireDocumentSegment(auth.uid, "authenticated uid");
  const requestId = requireDocumentSegment(data?.requestId, "requestId", 128);
  const name = studioName(data?.name);
  const requestFingerprint = operationId("create_studio_tenant", actorUid, name);
  const requestRef = db.collection("studioOperationRequests").doc(operationId("create", actorUid, requestId));
  const proposedStudioRef = db.collection("studios").doc();
  const proposedOwnerRef = membershipRef(proposedStudioRef.id, actorUid);
  const auditRef = db.collection("auditLogs").doc();

  return db.runTransaction(async (transaction) => {
    const priorRequest = await transaction.get(requestRef);
    if (priorRequest.exists) return priorRequestResult(priorRequest, requestFingerprint);

    const now = admin.firestore.FieldValue.serverTimestamp();
    const result = { ok: true, studioId: proposedStudioRef.id, role: "owner" as const };
    transaction.create(proposedStudioRef, { studioId: proposedStudioRef.id, name, createdBy: actorUid, createdAt: now, updatedAt: now });
    transaction.create(proposedOwnerRef, {
      uid: actorUid,
      studioId: proposedStudioRef.id,
      role: "owner",
      status: "active",
      schemaVersion: MEMBERSHIP_SCHEMA_VERSION,
      authoritySource: "create_studio_tenant",
      createdBy: actorUid,
      createdAt: now,
      updatedBy: actorUid,
      updatedAt: now,
    });
    transaction.create(auditRef, { actorUid, studioId: proposedStudioRef.id, action: "create_studio_tenant", target: `studios/${proposedStudioRef.id}`, before: null, after: { name, ownerUid: actorUid }, requestId, createdAt: now });
    transaction.create(requestRef, { actorUid, action: "create_studio_tenant", requestId, requestFingerprint, result, createdAt: now });
    return result;
  });
});

export const manageStudioMembership = functions.https.onCall(async (data, context) => {
  requireMembershipMutationsOpen();
  const auth = requireAuth(context);
  const actorUid = requireDocumentSegment(auth.uid, "authenticated uid");
  const studioId = requireDocumentSegment(data?.studioId, "studioId");
  const targetUid = requireDocumentSegment(data?.targetUid, "targetUid");
  const requestId = requireDocumentSegment(data?.requestId, "requestId", 128);
  const action = requireAction(data?.action);
  const requestedRole = action === "upsert" ? requireRole(data?.role) : null;
  const requestedStatus = action === "upsert" ? requireStatus(data?.status ?? "active") : null;
  const requestFingerprint = operationId("manage_studio_membership", actorUid, studioId, targetUid, action, requestedRole ?? "", requestedStatus ?? "");
  if (targetUid === actorUid) throw new functions.https.HttpsError("permission-denied", "Self-service role, status, and membership changes are not allowed.");
  if (requestedRole === "owner") throw new functions.https.HttpsError("failed-precondition", "Owner grants require the audited ownership-transfer operation.");

  const actorRef = membershipRef(studioId, actorUid);
  const targetRef = membershipRef(studioId, targetUid);
  const studioRef = db.collection("studios").doc(studioId);
  const auditRef = db.collection("auditLogs").doc();
  const requestRef = db.collection("studioOperationRequests").doc(operationId("membership", actorUid, studioId, requestId));

  return db.runTransaction(async (transaction) => {
    const [priorRequest, studioSnapshot, actorSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(requestRef), transaction.get(studioRef), transaction.get(actorRef), transaction.get(targetRef),
    ]);
    if (priorRequest.exists) return priorRequestResult(priorRequest, requestFingerprint);
    if (!studioSnapshot.exists) throw new functions.https.HttpsError("not-found", "Studio not found.");
    const actor = requireCanonicalMembership(actorSnapshot.data(), actorUid, studioId);
    const actorRole = actor.role as StudioRole | undefined;
    if (actor.status !== "active" || (actorRole !== "owner" && actorRole !== "admin")) throw new functions.https.HttpsError("permission-denied", "Active owner or admin membership is required.");

    const before = targetSnapshot.exists ? requireCanonicalMembership(targetSnapshot.data(), targetUid, studioId) : null;
    const existingRole = before?.role as StudioRole | undefined;
    if (existingRole === "owner") throw new functions.https.HttpsError("failed-precondition", "Owner changes require the audited ownership-transfer operation.");
    if (actorRole === "admin" && (existingRole === "admin" || requestedRole === "admin")) throw new functions.https.HttpsError("permission-denied", "Admins cannot grant, alter, or remove admin membership.");

    const now = admin.firestore.FieldValue.serverTimestamp();
    if (action === "remove") {
      if (!targetSnapshot.exists) throw new functions.https.HttpsError("not-found", "Target membership not found.");
      transaction.delete(targetRef);
    } else {
      transaction.set(targetRef, {
        uid: targetUid,
        studioId,
        role: requestedRole,
        status: requestedStatus,
        schemaVersion: MEMBERSHIP_SCHEMA_VERSION,
        authoritySource: "manage_studio_membership",
        createdBy: before?.createdBy ?? actorUid,
        createdAt: before?.createdAt ?? now,
        updatedBy: actorUid,
        updatedAt: now,
      });
    }

    const result = { ok: true, studioId, targetUid, action, role: requestedRole, status: requestedStatus };
    transaction.create(auditRef, { actorUid, studioId, action: action === "remove" ? "remove_studio_membership" : "upsert_studio_membership", target: targetRef.path, before, after: action === "remove" ? null : { uid: targetUid, studioId, role: requestedRole, status: requestedStatus, schemaVersion: MEMBERSHIP_SCHEMA_VERSION }, requestId, createdAt: now });
    transaction.create(requestRef, { actorUid, studioId, action: "manage_studio_membership", requestId, requestFingerprint, result, createdAt: now });
    return result;
  });
});

export const transferStudioOwnership = functions.https.onCall(async (data, context) => {
  requireMembershipMutationsOpen();
  const auth = requireAuth(context);
  const actorUid = requireDocumentSegment(auth.uid, "authenticated uid");
  const studioId = requireDocumentSegment(data?.studioId, "studioId");
  const targetUid = requireDocumentSegment(data?.targetUid, "targetUid");
  const requestId = requireDocumentSegment(data?.requestId, "requestId", 128);
  const requestFingerprint = operationId("transfer_studio_ownership", actorUid, studioId, targetUid);
  if (targetUid === actorUid) throw new functions.https.HttpsError("invalid-argument", "The target owner must be another active member.");

  const studioRef = db.collection("studios").doc(studioId);
  const actorRef = membershipRef(studioId, actorUid);
  const targetRef = membershipRef(studioId, targetUid);
  const auditRef = db.collection("auditLogs").doc();
  const requestRef = db.collection("studioOperationRequests").doc(operationId("transfer", actorUid, studioId, requestId));

  return db.runTransaction(async (transaction) => {
    const [priorRequest, studioSnapshot, actorSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(requestRef), transaction.get(studioRef), transaction.get(actorRef), transaction.get(targetRef),
    ]);
    if (priorRequest.exists) return priorRequestResult(priorRequest, requestFingerprint);
    if (!studioSnapshot.exists) throw new functions.https.HttpsError("not-found", "Studio not found.");
    const actor = requireCanonicalMembership(actorSnapshot.data(), actorUid, studioId);
    const target = requireCanonicalMembership(targetSnapshot.data(), targetUid, studioId);
    if (actor.status !== "active" || actor.role !== "owner") throw new functions.https.HttpsError("permission-denied", "Active owner membership is required.");
    if (target.status !== "active" || target.role === "owner") throw new functions.https.HttpsError("failed-precondition", "Target must be an active non-owner member.");

    const now = admin.firestore.FieldValue.serverTimestamp();
    transaction.update(actorRef, { role: "admin", authoritySource: "transfer_studio_ownership", updatedBy: actorUid, updatedAt: now });
    transaction.update(targetRef, { role: "owner", authoritySource: "transfer_studio_ownership", updatedBy: actorUid, updatedAt: now });
    const result = { ok: true, studioId, previousOwnerUid: actorUid, ownerUid: targetUid };
    transaction.create(auditRef, { actorUid, studioId, action: "transfer_studio_ownership", target: `studios/${studioId}`, before: { ownerUid: actorUid, targetRole: target.role }, after: { ownerUid: targetUid, previousOwnerRole: "admin" }, requestId, createdAt: now });
    transaction.create(requestRef, { actorUid, studioId, action: "transfer_studio_ownership", requestId, requestFingerprint, result, createdAt: now });
    return result;
  });
});
