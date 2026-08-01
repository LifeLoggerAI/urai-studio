import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const roles = ["owner", "admin", "editor", "reviewer", "viewer"] as const;
const statuses = ["active", "suspended", "revoked"] as const;

type StudioRole = (typeof roles)[number];
type MembershipStatus = (typeof statuses)[number];
type MembershipAction = "upsert" | "remove";

function requireAuth(context: functions.https.CallableContext) {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication is required.");
  }
  return context.auth;
}

function requireId(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new functions.https.HttpsError("invalid-argument", `${field} is required.`);
  }
  const normalized = value.trim();
  if (!/^[A-Za-z0-9_-]{1,96}$/.test(normalized)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `${field} must contain only letters, numbers, underscores, or hyphens.`
    );
  }
  return normalized;
}

function requireRole(value: unknown): StudioRole {
  if (!roles.includes(value as StudioRole)) {
    throw new functions.https.HttpsError("invalid-argument", "Unsupported Studio role.");
  }
  return value as StudioRole;
}

function requireStatus(value: unknown): MembershipStatus {
  if (!statuses.includes(value as MembershipStatus)) {
    throw new functions.https.HttpsError("invalid-argument", "Unsupported membership status.");
  }
  return value as MembershipStatus;
}

function requireAction(value: unknown): MembershipAction {
  if (value !== "upsert" && value !== "remove") {
    throw new functions.https.HttpsError("invalid-argument", "action must be upsert or remove.");
  }
  return value;
}

function membershipId(uid: string, studioId: string) {
  return `${uid}_${studioId}`;
}

function studioName(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "URAI Studio";
  return value.trim().slice(0, 160);
}

export const createStudioTenant = functions.https.onCall(async (data, context) => {
  const auth = requireAuth(context);
  const studioRef = db.collection("studios").doc();
  const ownerRef = db.collection("memberships").doc(membershipId(auth.uid, studioRef.id));
  const auditRef = db.collection("auditLogs").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();
  const name = studioName(data?.name);

  const batch = db.batch();
  batch.set(studioRef, {
    name,
    createdBy: auth.uid,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(ownerRef, {
    uid: auth.uid,
    studioId: studioRef.id,
    role: "owner",
    status: "active",
    createdBy: auth.uid,
    createdAt: now,
    updatedAt: now,
  });
  batch.set(auditRef, {
    actorUid: auth.uid,
    studioId: studioRef.id,
    action: "create_studio_tenant",
    target: `studios/${studioRef.id}`,
    before: null,
    after: { name, ownerUid: auth.uid },
    createdAt: now,
  });
  await batch.commit();

  return { ok: true, studioId: studioRef.id, role: "owner" as const };
});

export const manageStudioMembership = functions.https.onCall(async (data, context) => {
  const auth = requireAuth(context);
  const studioId = requireId(data?.studioId, "studioId");
  const targetUid = requireId(data?.targetUid, "targetUid");
  const action = requireAction(data?.action);
  const requestedRole = action === "upsert" ? requireRole(data?.role) : null;
  const requestedStatus = action === "upsert" ? requireStatus(data?.status ?? "active") : null;

  if (targetUid === auth.uid) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Self-service role, status, and membership changes are not allowed."
    );
  }

  const actorRef = db.collection("memberships").doc(membershipId(auth.uid, studioId));
  const targetRef = db.collection("memberships").doc(membershipId(targetUid, studioId));
  const studioRef = db.collection("studios").doc(studioId);
  const auditRef = db.collection("auditLogs").doc();

  await db.runTransaction(async (transaction) => {
    const [studioSnapshot, actorSnapshot, targetSnapshot] = await Promise.all([
      transaction.get(studioRef),
      transaction.get(actorRef),
      transaction.get(targetRef),
    ]);

    if (!studioSnapshot.exists) {
      throw new functions.https.HttpsError("not-found", "Studio not found.");
    }
    if (!actorSnapshot.exists) {
      throw new functions.https.HttpsError("permission-denied", "Active Studio membership is required.");
    }

    const actor = actorSnapshot.data() ?? {};
    const actorRole = actor.role as StudioRole | undefined;
    if (actor.status !== "active" || (actorRole !== "owner" && actorRole !== "admin")) {
      throw new functions.https.HttpsError("permission-denied", "Active owner or admin membership is required.");
    }

    const before = targetSnapshot.exists ? targetSnapshot.data() ?? null : null;
    const existingRole = before?.role as StudioRole | undefined;

    if (existingRole === "owner" && action === "remove") {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Owner removal requires a separate audited ownership-transfer operation."
      );
    }
    if (
      existingRole === "owner" &&
      action === "upsert" &&
      (requestedRole !== "owner" || requestedStatus !== "active")
    ) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Owner demotion or suspension requires a separate audited ownership-transfer operation."
      );
    }
    if (
      actorRole === "admin" &&
      (existingRole === "owner" || existingRole === "admin" || requestedRole === "owner" || requestedRole === "admin")
    ) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Admins cannot grant, alter, or remove owner/admin membership."
      );
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    if (action === "remove") {
      if (!targetSnapshot.exists) {
        throw new functions.https.HttpsError("not-found", "Target membership not found.");
      }
      transaction.delete(targetRef);
    } else {
      transaction.set(
        targetRef,
        {
          uid: targetUid,
          studioId,
          role: requestedRole,
          status: requestedStatus,
          createdBy: before?.createdBy ?? auth.uid,
          createdAt: before?.createdAt ?? now,
          updatedBy: auth.uid,
          updatedAt: now,
        },
        { merge: true }
      );
    }

    transaction.set(auditRef, {
      actorUid: auth.uid,
      studioId,
      action: action === "remove" ? "remove_studio_membership" : "upsert_studio_membership",
      target: `memberships/${targetRef.id}`,
      before,
      after:
        action === "remove"
          ? null
          : { uid: targetUid, studioId, role: requestedRole, status: requestedStatus },
      createdAt: now,
    });
  });

  return { ok: true, studioId, targetUid, action, role: requestedRole, status: requestedStatus };
});
