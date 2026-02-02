
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const storage = admin.storage();

// Helper function to write an audit log entry
const writeAuditLog = (
  actorUid: string,
  action: string,
  target: string,
  before: any,
  after: any
) => {
  return db.collection("auditLogs").add({
    actorUid,
    action,
    target,
    before,
    after,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// Helper function to log an event for a specific job
const logJobEvent = (
  jobId: string,
  type: "state_change" | "log" | "artifact",
  message: string,
  data: object = {}
) => {
  return db.collection("jobs").doc(jobId).collection("events").add({
    type,
    message,
    data,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
};

// Placeholder for the actual job processing logic
const processJob = async (job: admin.firestore.DocumentData) => {
    const { id, projectId, kind } = job;
    const bucket = storage.bucket();
    let outputFile;
    let outputData: { path: string };

    switch (kind) {
        case "clip_render":
            outputFile = bucket.file(`projects/${projectId}/renders/${id}/placeholder.mp4`);
            await outputFile.save("This is a placeholder for a rendered clip.");
            outputData = { path: outputFile.name };
            break;
        case "thumbnail":
            outputFile = bucket.file(`projects/${projectId}/renders/${id}/thumbnail.jpg`);
            await outputFile.save("This is a placeholder for a thumbnail.");
            outputData = { path: outputFile.name };
            break;
        case "captions":
            outputFile = bucket.file(`projects/${projectId}/renders/${id}/captions.srt`);
            await outputFile.save("1\n00:00:01,000 --> 00:00:02,000\nPlaceholder caption");
            outputData = { path: outputFile.name };
            break;
        case "package_export":
            outputFile = bucket.file(`projects/${projectId}/exports/${id}/package.zip`);
            await outputFile.save("This is a placeholder for a packaged export.");
            outputData = { path: outputFile.name };
            break;
        case "publish":
            // This job kind updates a "publishes" document, not a file.
            // Logic to update the publish doc will be handled separately.
            outputData = { message: "Publish job processed successfully." };
            break;
        default:
            throw new Error(`Unknown job kind: ${kind}`);
    }

    return outputData;
};


export const jobRunner = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const configDoc = await db.doc("system/config").get();
    const { maxJobAttempts = 3, leaseSeconds = 300 } = configDoc.data() || {};
    const now = admin.firestore.Timestamp.now();
    const leaseExpiresAt = new admin.firestore.Timestamp(now.seconds + leaseSeconds, now.nanoseconds);
    const runnerId = context.eventId;

    // Query for jobs that are either queued or have an expired lease
    const queuedJobsQuery = db.collection("jobs").where("state", "==", "queued").orderBy("priority", "desc").orderBy("createdAt");
    const expiredJobsQuery = db.collection("jobs").where("state", "==", "running").where("leaseExpiresAt", "<", now).orderBy("priority", "desc").orderBy("createdAt");

    const [queuedJobsSnapshot, expiredJobsSnapshot] = await Promise.all([
      queuedJobsQuery.get(),
      expiredJobsQuery.get(),
    ]);

    const jobsToProcess = [...queuedJobsSnapshot.docs, ...expiredJobsSnapshot.docs];
    if (jobsToProcess.length === 0) {
      console.log("No jobs to process.");
      return;
    }

    for (const jobDoc of jobsToProcess) {
      const jobId = jobDoc.id;
      const jobRef = db.collection("jobs").doc(jobId);
      let success = false;
      let finalState = "failed";

      try {
        await db.runTransaction(async (transaction) => {
          const freshJobDoc = await transaction.get(jobRef);
          if (!freshJobDoc.exists) return;

          const jobData = freshJobDoc.data()!;
          const { state, attempt = 0 } = jobData;
          
          if (state !== 'queued' && (state !== 'running' || jobData.leaseExpiresAt > now)) {
              return; // Job was already claimed or is not in a runnable state
          }

          if (attempt >= maxJobAttempts) {
              transaction.update(jobRef, { 
                  state: "failed", 
                  error: { message: "Maximum attempts reached." },
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
              });
              await logJobEvent(jobId, "state_change", "Job failed: Maximum attempts reached.");
              return;
          }

          transaction.update(jobRef, {
            state: "running",
            claimedBy: runnerId,
            leaseExpiresAt,
            attempt: attempt + 1,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });

        // --- Process the job outside the transaction ---
        const claimedJobData = (await jobRef.get()).data()!;
        await logJobEvent(jobId, "state_change", `Job claimed by runner ${runnerId}. Attempt ${claimedJobData.attempt}.`);
        
        const output = await processJob({ id: jobId, ...claimedJobData });

        await jobRef.update({
          state: "succeeded",
          output: output,
          error: null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await logJobEvent(jobId, "state_change", "Job succeeded.");
        await writeAuditLog("system", "job_succeeded", `jobs/${jobId}`, claimedJobData, (await jobRef.get()).data());
        success = true;
        finalState = "succeeded";

      } catch (e: any) {
        console.error(`Error processing job ${jobId}:`, e);
        const currentJobData = (await jobRef.get()).data()!;
        const { attempt } = currentJobData;

        const error = { message: e.message, stack: e.stack };
        let updateData: any = { error };

        if (attempt >= maxJobAttempts) {
            updateData.state = "failed";
            finalState = "failed";
        } else {
            // Keep it in "running" so the expired lease logic picks it up again
            finalState = "retry"; 
        }
        
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await jobRef.update(updateData);
        await logJobEvent(jobId, "log", `Job error: ${e.message}`);

        if (finalState === 'failed') {
            await logJobEvent(jobId, "state_change", `Job failed after ${attempt} attempts.`);
            await writeAuditLog("system", "job_failed", `jobs/${jobId}`, currentJobData, (await jobRef.get()).data());
        }
      }
    }
});
