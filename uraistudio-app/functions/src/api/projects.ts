import * as express from 'express';

export const projectsRouter = express.Router();

// GET /api/projects/:projectId/outputs
projectsRouter.get('/:projectId/outputs', (req, res) => {
  // TODO: Fetch outputs from Firestore
  res.status(200).send([{
    id: 'output-1',
    url: `/asset/share-1/output-1`
  }]);
});
