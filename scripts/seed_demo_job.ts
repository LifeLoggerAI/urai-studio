
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
// Make sure to set the GOOGLE_APPLICATION_CREDENTIALS environment variable
// to the path of your service account key file.
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
  });
}

const db = admin.firestore();

async function seedDemoJob() {
  const jobId = 'demo-job';
  const jobRef = db.collection('studioJobs').doc(jobId);

  const demoJob = {
    jobId,
    title: 'Demo Job',
    kind: 'clip_demo',
    status: 'SUCCEEDED',
    progress: 1,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    input: {
      prompt: 'A beautiful landscape',
      durationSec: 15,
      aspect: '16:9',
    },
    output: {
      url: 'https://firebasestorage.googleapis.com/v0/b/urai-studio.appspot.com/o/demo-output.mp4?alt=media&token=db3e8e6a-0b2b-4c9f-9d3e-2b1b0e3e2b1b',
    },
    logs: [
      { t: Date.now(), level: 'info', msg: 'Job created' },
      { t: Date.now() + 1000, level: 'info', msg: 'Job started' },
      { t: Date.now() + 2000, level: 'info', msg: 'Job completed' },
    ],
    demo: true,
  };

  try {
    await jobRef.set(demoJob, { merge: true });
    console.log(`Successfully seeded demo job with ID: ${jobId}`);
  } catch (error) {
    console.error('Error seeding demo job:', error);
  }
}

seedDemoJob();
