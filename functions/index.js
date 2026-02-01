const functions = require("firebase-functions");
const admin = require("firebase-admin");

exports.processJob = functions.firestore
  .document("studioJobs/{jobId}")
  .onCreate(async (snap, context) => {
    const job = snap.data();
    const jobId = context.params.jobId;

    // Simulate video processing
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Update the job status
    await admin.firestore().collection("studioJobs").doc(jobId).update({
      status: "complete",
    });

    // Create a dummy output
    await admin.firestore().collection("studioOutputs").add({
      projectId: job.projectId,
      jobId: jobId,
      name: "output.mp4",
      url: "https://storage.googleapis.com/demo-urai-studio.appspot.com/outputs/output.mp4",
    });
  });
