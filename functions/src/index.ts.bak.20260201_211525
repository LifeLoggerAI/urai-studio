import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Upload, Job, Version, ContentItem } from "@urai/types";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// Allowed mime types for uploads
const ALLOWED_MIME_TYPES = ["video/mp4", "video/quicktime", "video/webm", "audio/mpeg", "audio/wav"];
const MAX_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB

/**
 * Validates an upload when a new upload document is created.
 */
export const validateUpload = functions.firestore
  .document("contentItems/{itemId}/uploads/{uploadId}")
  .onCreate(async (snap, context) => {
    const upload = snap.data() as Upload;
    const { itemId, uploadId } = context.params;

    const updates: Partial<Upload> = {};

    // Check mime type
    if (!ALLOWED_MIME_TYPES.includes(upload.contentType)) {
      updates.status = "rejected";
      updates.rejectReason = `Invalid content type: ${upload.contentType}`;
    }
    // Check size
    else if (upload.size > MAX_SIZE_BYTES) {
      updates.status = "rejected";
      updates.rejectReason = `File size exceeds limit of ${MAX_SIZE_BYTES} bytes`;
    } else {
      updates.status = "validated";
    }

    await db.collection("contentItems").doc(itemId).collection("uploads").doc(uploadId).update(updates);

    // Create audit log
    await db.collection("auditLogs").add({
      actorUid: upload.ownerUid,
      actorRole: "user",
      action: "upload",
      targetType: "upload",
      targetId: uploadId,
      metadata: {
        itemId,
        status: updates.status,
        rejectReason: updates.rejectReason,
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

/**
 * Enqueues jobs for a new version.
 */
export const enqueueJobsForVersion = functions.firestore
  .document("contentItems/{itemId}/versions/{versionId}")
  .onCreate(async (snap, context) => {
    const version = snap.data() as Version;
    const { itemId, versionId } = context.params;
    const { ownerUid } = version;

    // Create a chain of jobs
    const jobs: Omit<Job, "createdAt" | "updatedAt">[] = [
      { ownerUid, itemId, versionId, type: "transcode", status: "queued", progressPct: 0, stage: "", attempts: 0 },
      { ownerUid, itemId, versionId, type: "captions", status: "queued", progressPct: 0, stage: "", attempts: 0 },
      { ownerUid, itemId, versionId, type: "thumbnail", status: "queued", progressPct: 0, stage: "", attempts: 0 },
      { ownerUid, itemId, versionId, type: "renderShort", status: "queued", progressPct: 0, stage: "", attempts: 0 },
    ];

    const batch = db.batch();
    for (const job of jobs) {
      const jobRef = db.collection("jobs").doc();
      batch.set(jobRef, { ...job, createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    }
    await batch.commit();

    // Update content item status
    await db.collection("contentItems").doc(itemId).update({ statusSummary: "processing" });

    // Create audit log
    await db.collection("auditLogs").add({
      actorUid: ownerUid,
      actorRole: "user",
      action: "create_version",
      targetType: "version",
      targetId: versionId,
      metadata: { itemId },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

/**
 * Worker function to process jobs.
 */
export const worker = functions.firestore.document("jobs/{jobId}").onUpdate(async (change, context) => {
  const job = change.after.data() as Job;
  const { jobId } = context.params;

  // Only process running jobs
  if (job.status !== "running") {
    return;
  }

  // Implement locking to prevent double processing
  const now = admin.firestore.Timestamp.now();
  if (job.lockExpiresAt && job.lockExpiresAt > now) {
    return;
  }

  const lockId = Math.random().toString(36).substring(2);
  await db.collection("jobs").doc(jobId).update({
    lockedBy: lockId,
    lockExpiresAt: admin.firestore.Timestamp.fromMillis(now.toMillis() + 60 * 1000), // 1 minute lock
    lastHeartbeatAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  try {
    // V1 Stub Render
    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate work

    const updates: Partial<Job> = {
      status: "succeeded",
      progressPct: 100,
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("jobs").doc(jobId).update(updates);

    // Update version outputs
    const { itemId, versionId, type } = job;
    const versionRef = db.collection("contentItems").doc(itemId).collection("versions").doc(versionId);

    const outputKey = type === "renderShort" ? "final.mp4" : `${type}.srt`;
    const storagePath = `outputs/${job.ownerUid}/${itemId}/${versionId}/${outputKey}`;

    await versionRef.update({
      [`outputs.${type}`]: storagePath,
    });

    // Copy the uploaded file to the output path (stub render)
    const contentItem = (await db.collection("contentItems").doc(itemId).get()).data() as ContentItem;
    const uploads = await db.collection("contentItems").doc(itemId).collection("uploads").where("status", "==", "validated").limit(1).get();
    if (uploads.empty) {
      throw new Error("No validated uploads found");
    }
    const upload = uploads.docs[0].data() as Upload;

    const sourceFile = storage.bucket().file(upload.storagePath);
    const destFile = storage.bucket().file(storagePath);
    await sourceFile.copy(destFile);

    // Check if all jobs for the version are complete
    const jobsSnapshot = await db.collection("jobs").where("versionId", "==", versionId).get();
    const allJobsSucceeded = jobsSnapshot.docs.every(doc => doc.data().status === "succeeded");

    if (allJobsSucceeded) {
      await db.collection("contentItems").doc(itemId).update({ statusSummary: "ready" });
      await versionRef.update({ status: "ready" });
    }

    // Create audit log
    await db.collection("auditLogs").add({
      actorRole: "system",
      action: `job_${job.status}`,
      targetType: "job",
      targetId: jobId,
      metadata: { itemId, versionId },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  } catch (error) {
    const updates: Partial<Job> = {
      status: "failed",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("jobs").doc(jobId).update(updates);

    // Create audit log
    await db.collection("auditLogs").add({
      actorRole: "system",
      action: "job_failed",
      targetType: "job",
      targetId: jobId,
      metadata: { error: updates.errorMessage },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});
