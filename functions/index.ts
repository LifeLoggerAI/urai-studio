import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

export const jobWorker = functions.firestore
  .document("studioJobs/{jobId}")
  .onCreate(async (snap, context) => {
    const { jobId } = context.params;
    const jobData = snap.data();

    // In a real scenario, this is where you would trigger the asset pipeline
    // For this Tier 0 implementation, we'll just mark the job as "complete"

    await db.collection("studioJobs").doc(jobId).update({
      status: "complete",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create a dummy output
    await db.collection("studioOutputs").add({
      jobId,
      projectId: jobData.projectId,
      ownerId: jobData.ownerId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      url: `https://storage.googleapis.com/demo-urai-studio.appspot.com/outputs/${jobId}/output.mp4`
    });
  });
