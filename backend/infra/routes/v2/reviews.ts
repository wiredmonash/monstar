import express from 'express';

import ReviewController from '@controllers/review.controller';
import adminMiddleware from '@middleware/admin.middleware';
import userMiddleware from '@middleware/user.middleware';

const router = express.Router();

router.get(
  '/',
  adminMiddleware,
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Get all reviews with optional filter'
  ReviewController.getAll
);

router.get(
  '/popular',
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Get N most liked reviews'
  ReviewController.getMostLiked
)

router.get(
  '/:unit',
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Get all reviews for a specific unit'
  ReviewController.getByUnit
);

router.get(
  '/user/:userId',
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Get all reviews by a specific user'
  ReviewController.getByUser
);

router.post(
  '/:unit/create',
  userMiddleware,
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Create a review for a specific unit'
  ReviewController.createReview
);

router.put(
  '/update/:reviewId',
  userMiddleware,
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Update a review by ID'
  ReviewController.updateReview
);

router.delete(
  '/delete/:reviewId',
  userMiddleware,
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Delete a review by ID'
  ReviewController.deleteReview
);

router.patch(
  '/toggle-reaction/:reviewId',
  userMiddleware,
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Toggle like/dislike on a review'
  ReviewController.toggleReaction
);

router.post(
  '/send-report',
  userMiddleware,
  // #swagger.tags = ['Reviews V2']
  // #swagger.summary = 'Send report email for a review'
  ReviewController.sendReport
);

export default router;
