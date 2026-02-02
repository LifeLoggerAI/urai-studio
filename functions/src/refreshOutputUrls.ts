
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

const db = admin.firestore();
const storage = getStorage();

export const refreshOutputUrls = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be logged in.");
  }

  const { contentId } = data;
  const uid = context.auth.uid;

  if (!contentId) {
    throw new functions.https.HttpsError("invalid-argument", "Missing content ID.");
  }

  const contentRef = db.collection("contentItems").doc(contentId);
  const contentDoc = await contentRef.get();

  if (!contentDoc.exists || contentDoc.data()?.ownerUid !== uid) {
    throw new functions.https.HttpsError("permission-denied", "You do not have permission to access this content.");
  }

  const contentData = contentDoc.data();
  const outputs = contentData.outputs || [];
  const bucket = storage.bucket();

  for (const output of outputs) {
    if (output.storagePath) {
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour
      const [url] = await bucket.file(output.storagePath).getSignedUrl({
        action: "read",
        expires,
      });
      output.url = url;
    }
  }

  await contentRef.update({
    outputs,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { outputs };
});
