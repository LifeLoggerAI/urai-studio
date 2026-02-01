import * as express from 'express';

export const assetsRouter = express.Router();

// GET /api/asset/:shareId/:artifactId
assetsRouter.get('/:shareId/:artifactId', (req, res) => {
  // TODO: Add security check and redirect to signed GCS URL
  res.status(200).send(`Serving asset ${req.params.artifactId} for share ${req.params.shareId}`);
});
