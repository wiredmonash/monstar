import express from 'express';

import { verifyToken } from '@domains/identity/users';

import ReviewV1Controller from './review.v1.controller';

const router = express.Router();

// The other v1 review endpoints (list/read/create/update/delete/toggle) were
// removed once the frontend moved to their /api/v2/reviews equivalents.
// send-report is the only v1 review endpoint the frontend still calls.
router.post(
  '/send-report',
  verifyToken,
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Send an email corresponding to a user\'s report on a review'
  ReviewV1Controller.sendReport
);

export default router;
