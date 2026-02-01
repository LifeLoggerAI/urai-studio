import * as express from 'express';

export const jobsRouter = express.Router();

// POST /api/jobs
jobsRouter.post('/', (req, res) => {
  // TODO: Add validation and create job in Firestore
  res.status(201).send({ id: 'new-job-id-from-api' });
});

// GET /api/jobs/:jobId
jobsRouter.get('/:jobId', (req, res) => {
  // TODO: Fetch job from Firestore
  res.status(200).send({ id: req.params.jobId, status: 'processing' });
});
