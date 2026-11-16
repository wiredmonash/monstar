import asyncHandler from '@shared/utilities/asyncHandler';
import ReviewService from './review.service';

class ReviewController {
  /**
   * Get all reviews (with optional filter from body)
   */
  static getAll = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.fetchAll(req.body);
    return res.status(200).json(reviews);
  });

  /**
   * Get N most liked reviews
   */
  static getMostLiked = asyncHandler(async (req, res) => {
    const n = req.query.n === undefined ? undefined : Number(req.query.n);
    const reviews = await ReviewService.fetchMostLiked(n);
    return res.status(200).json(reviews);
  });

  /**
   * Get all reviews for a specific unit
   */
  static getByUnit = asyncHandler(async (req, res) => {
    const unitCode = req.params.unit.toLowerCase();

    const reviews = await ReviewService.fetchByUnit(unitCode);
    return res.status(200).json(reviews);
  });

  /**
   * Get all reviews by a specific user
   */
  static getByUser = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.fetchByUser(req.params.userId);
    return res.status(200).json(reviews);
  });

  /**
   * Create a new review for a unit
   */
  static createReview = asyncHandler(async (req, res) => {
    const unitCode = req.params.unit.toLowerCase();
    const authUserId = req.user?.id || req.user?._id;
    const requestBody = req.body || {};
    const requestedAuthorId = requestBody.author;

    if (!authUserId) {
      return res.status(401).json({
        error: 'You are not authenticated',
      });
    }

    // Verify that the author in the request body (if provided) matches token user
    if (
      requestedAuthorId &&
      requestedAuthorId.toString() !== authUserId.toString()
    ) {
      return res.status(403).json({
        error: 'You are not authorized to create a review for this unit',
      });
    }

    // Take only the review fields and enforce author from token
    const review = await ReviewService.createReview(unitCode, {
      title: requestBody.title,
      semester: requestBody.semester,
      grade: requestBody.grade,
      year: requestBody.year,
      overallRating: requestBody.overallRating,
      relevancyRating: requestBody.relevancyRating,
      facultyRating: requestBody.facultyRating,
      contentRating: requestBody.contentRating,
      description: requestBody.description,
      author: authUserId,
    });
    return res.status(201).json(review);
  });

  /**
   * Update a review by ID
   */
  static updateReview = asyncHandler(async (req, res) => {
    const updatedReview = await ReviewService.updateReview(
      req.params.reviewId,
      req.user!.id,
      req.body
    );

    return res.status(200).json({
      message: 'Review successfully updated',
      review: updatedReview,
    });
  });

  /**
   * Delete a review by ID
   */
  static deleteReview = asyncHandler(async (req, res) => {
    await ReviewService.deleteReview(req.params.reviewId, req.user!.id);

    return res.status(200).json({
      message: 'Review successfully deleted',
    });
  });

  /**
   * Toggle like/dislike on a review
   */
  static toggleReaction = asyncHandler(async (req, res) => {
    const reviewId = req.params.reviewId;
    // The reacting user comes from the token, never from the body
    const { reactionType } = req.body;

    if (!['like', 'dislike'].includes(reactionType)) {
      return res.status(400).json({
        error: 'Invalid reaction type. Must be "like" or "dislike"',
      });
    }

    const result = await ReviewService.toggleReaction(
      reviewId,
      req.user!.id,
      reactionType
    );

    return res.status(200).json(result);
  });
}

export default ReviewController;
