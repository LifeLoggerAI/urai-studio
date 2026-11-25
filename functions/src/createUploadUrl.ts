
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import { validateSignedUploadRequest } from "./upload-url-validation";

const db = admin.firestore();
const storage = getStorage();

export const createUploadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  // R1738: validation is pre-signing only. It does NOT enforce a GCS body-size cap.
  let validated: ReturnType<typeof validateSignedUploadRequest>;
  try {
    validated = validateSignedUploadRequest(data, context.auth.uid);
  } catch (error) {
    throw new functions.https.HttpsError("invalid-argument",
      error instanceof Error ? error.message : "invalid_upload_request");
  }
  const { uid, fileName, mimeType, bytes } = validated;
  const { title, description } = data;

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
