
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";
import * as sharp from "sharp";
import { promisify } from "util";
import * as stream from "stream";

const db = admin.firestore();
const storage = getStorage();
const pipeline = promisify(stream.pipeline);

export const runJob = functions.firestore.document("jobs/{jobId}").onUpdate(async (change, context) => {
  const jobData = change.after.data();
  const jobRef = change.after.ref;

  if (jobData.status !== "queued") {
    return;
  }

  await jobRef.update({ status: "running", attempt: admin.firestore.FieldValue.increment(1) });

  const { contentId, ownerUid } = jobData;
  const contentRef = db.collection("contentItems").doc(contentId);

  try {
    const contentDoc = await contentRef.get();
    const contentData = contentDoc.data();
    if (!contentData) {
      throw new Error("Content item not found.");
    }

    const bucket = storage.bucket();
    const inputFile = bucket.file(contentData.input.storagePath);
    const outputs = [];

    if (contentData.input.mimeType.startsWith("image/")) {
      const sizes = { thumb: 200, medium: 800, large: 1600 };
      for (const [name, size] of Object.entries(sizes)) {
        const outputPath = `outputs/${ownerUid}/${contentId}/${name}.jpg`;
        const outputFile = bucket.file(outputPath);
        const writeStream = outputFile.createWriteStream({ contentType: "image/jpeg" });

        const resizeTransform = sharp().resize(size, size, { fit: "inside" }).jpeg();
        await pipeline(inputFile.createReadStream(), resizeTransform, writeStream);

        const [metadata] = await outputFile.getMetadata();
        outputs.push({
          type: "image/jpeg",
          storagePath: outputPath,
          bytes: metadata.size,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } else {
      // For now, just copy unknown types
      const outputPath = `outputs/${ownerUid}/${contentId}/normalized`;
      const outputFile = bucket.file(outputPath);
      await inputFile.copy(outputFile);

      const [metadata] = await outputFile.getMetadata();
      outputs.push({
        type: contentData.input.mimeType,
        storagePath: outputPath,
        bytes: metadata.size,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Generate download URLs
    for (const output of outputs) {
      const expires = Date.now() + 60 * 60 * 1000; // 1 hour
      const [url] = await bucket.file(output.storagePath).getSignedUrl({
        action: "read",
        expires,
      });
      output.url = url;
    }

    await contentRef.update({
      status: "ready",
      outputs,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await jobRef.update({
      status: "succeeded",
      result: { message: "Processing complete." },
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await contentRef.update({ status: "failed", error: errorMessage });
    await jobRef.update({ status: "failed", error: errorMessage });
  }
});
