
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

const db = admin.firestore();
const storage = getStorage();

export const createUploadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const { fileName, mimeType, bytes, title, description } = data;
  const uid = context.auth.uid;

  // Basic validation
  if (!fileName || !mimeType || !bytes) {
    throw new functions.https.HttpsError("invalid-argument", "Missing required parameters.");
  }

  // Size limit (500MB)
  if (bytes > 500 * 1024 * 1024) {
    throw new functions.https.HttpsError("invalid-argument", "File size exceeds 500MB limit.");
  }

  const contentRef = db.collection("contentItems").doc();
  const contentId = contentRef.id;

  const storagePath = `uploads/${uid}/${contentId}/${fileName}`;

  await contentRef.set({
    ownerUid: uid,
    title: title || "Untitled",
    description: description || null,
    status: "draft",
    input: {},
    storagePath,
    fileName,
    mimeType,
    bytes,
    outputs: [],
    error: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const expires = Date.now() + 60 * 60 * 1000; // 1 hour
  const [uploadUrl] = await storage.bucket().file(storagePath).getSignedUrl({
    version: "v4",
    action: "write",
    expires,
    contentType: mimeType,
  });

  await db.collection("auditLogs").add({
    actorUid: uid,
    action: "createUploadUrl",
    target: contentId,
    metadata: { fileName, mimeType, bytes },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { contentId, uploadUrl, storagePath };
});
