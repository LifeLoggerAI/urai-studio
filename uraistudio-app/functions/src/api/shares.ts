import * as express from 'express';

export const sharesRouter = express.Router();

// GET /api/share/:shareId
sharesRouter.get('/:shareId', (req, res) => {
  // TODO: Fetch share data from Firestore
  res.status(200).send({ id: req.params.shareId, title: 'My Awesome Video' });
});
