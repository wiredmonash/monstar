import express from 'express';

import { verifyToken } from '@domains/identity/users';

import ReviewV1Controller from './review.v1.controller';

const router = express.Router();

router.get(
  '/',
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Get all reviews from the database with an optional filter'
  ReviewV1Controller.getAll
);

router.get(
  '/:unit',
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Get all reviews for a unit from the database'
  ReviewV1Controller.getByUnit
);

router.get(
  '/user/:userId',
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Get all reviews by a specific user from the database'
  ReviewV1Controller.getByUser
);

router.post(
  '/:unit/create',
  verifyToken,
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Create a review for a specific unit'
  ReviewV1Controller.createReview
);

router.put(
  '/update/:reviewId',
  verifyToken,
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Update a review by MongoDB ID (e.g. Title, Grade Obtained, Ratings)'
  ReviewV1Controller.updateReview
);

router.delete(
  '/delete/:reviewId',
  verifyToken,
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Delete a review by MongoDB ID (also removes the review from the Unit\'s reviews array)'
  ReviewV1Controller.deleteReview
);

router.patch(
  '/toggle-reaction/:reviewId',
  verifyToken,
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Toggle the likes or dislikes field for a specific review by its ID'
  ReviewV1Controller.toggleReaction
);

router.post(
  '/send-report',
  verifyToken,
  // #swagger.tags = ['Reviews']
  // #swagger.summary = 'Send an email corresponding to a user\'s report on a review'
  ReviewV1Controller.sendReport
);

export default router;
