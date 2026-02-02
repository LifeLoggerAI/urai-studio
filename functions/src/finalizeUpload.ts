
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

export const finalizeUpload = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const { contentId, storagePath, mimeType, bytes } = data;
  const uid = context.auth.uid;

  if (!contentId || !storagePath || !mimeType || !bytes) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required parameters.");
  }

  const contentRef = db.collection("contentItems").doc(contentId);
  const contentDoc = await contentRef.get();

  if (!contentDoc.exists || contentDoc.data()?.ownerUid !== uid) {
    throw new functions.https.HttpsError("permission-denied", "You do not have permission to access this content.");
  }

  await contentRef.update({
    status: "uploaded",
    "input.storagePath": storagePath,
    "input.mimeType": mimeType,
    "input.bytes": bytes,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const jobRef = db.collection("jobs").doc();
  const jobId = jobRef.id;

  await jobRef.set({
    type: "processContent",
    contentId,
    ownerUid: uid,
    status: "queued",
    attempt: 0,
    log: [],
    result: null,
    error: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await db.collection("auditLogs").add({
    actorUid: uid,
    action: "finalizeUpload",
    target: contentId,
    metadata: { storagePath, mimeType, bytes, jobId },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, jobId };
});
