import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import { v4 as uuidv4 } from 'uuid';

admin.initializeApp();

const app = express();

// Middleware for authentication
const authenticate = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    res.status(403).send('Unauthorized');
    return;
  }
  const idToken = req.headers.authorization.split('Bearer ')[1];
  try {
    const decodedIdToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedIdToken;
    next();
  } catch (e) {
    res.status(403).send('Unauthorized');
  }
};

app.use(authenticate); // Use authentication for all routes

app.post('/jobs', async (req, res) => {
  try {
    const { projectId, recipeId } = req.body;
    const jobId = uuidv4();
    const job = {
      projectId,
      recipeId,
      status: 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await admin.firestore().collection('studioJobs').doc(jobId).set(job);
    res.status(201).send({ jobId });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/jobs/:jobId', async (req, res) => {
    try {
        const jobId = req.params.jobId;
        const jobDoc = await admin.firestore().collection('studioJobs').doc(jobId).get();
        if (!jobDoc.exists) {
            res.status(404).send('Job not found');
            return;
        }
        res.status(200).send(jobDoc.data());
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/projects/:projectId/outputs', async (req, res) => {
    try {
        const projectId = req.params.projectId;
        const outputsSnapshot = await admin.firestore().collection('studioOutputs').where('projectId', '==', projectId).get();
        const outputs = outputsSnapshot.docs.map(doc => doc.data());
        res.status(200).send(outputs);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

export const api = functions.https.onRequest(app);

export const worker = functions.firestore
  .document('studioJobs/{jobId}')
  .onCreate(async (snap, context) => {
    const jobId = context.params.jobId;
    const job = snap.data();

    // Simulate work by waiting for 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));

    await admin.firestore().collection('studioJobs').doc(jobId).update({ status: 'complete' });

    // Create an output for the job
    const outputId = uuidv4();
    const output = {
        projectId: job.projectId,
        jobId: jobId,
        url: `https://fake-url.com/${outputId}`
    };

    await admin.firestore().collection('studioOutputs').doc(outputId).set(output);
  });
