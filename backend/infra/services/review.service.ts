import ReviewRepository from '@repositories/review.repository';
import UnitRepository from '@repositories/unit.repository';
import UserRepository from '@repositories/user.repository';
import NotificationService from '@services/notification.service';
import {
  Error404NotFound,
  Error409Conflict,
  Error401NotAuthorized,
} from '@utilities/errors';

class ReviewService {
  /**
   * Fetch all reviews with optional filter
   */
  static fetchAll = async (filter = {}) => {
    return await ReviewRepository.findAll(filter);
  };

  /**
   * Fetch N most liked reviews
   */
  static fetchMostLiked = async (n = 10) => {
    return await ReviewRepository.findMostLiked(n);
  };

  /**
   * Fetch all reviews for a specific unit
   */
  static fetchByUnit = async (unitCode) => {
    // Find the unit first
    const unit = await UnitRepository.findOneByUnitcode(unitCode);
    if (!unit) throw new Error404NotFound(`Unit not found`);

    return await ReviewRepository.findByUnitId(unit._id);
  };

  /**
   * Fetch all reviews by a specific user
   */
  static fetchByUser = async (userId) => {
    return await ReviewRepository.findByUserId(userId);
  };

  /**
   * Create a new review for a unit
   */
  static createReview = async (unitCode, reviewData) => {
    // Find the unit
    const unit = await UnitRepository.findOneByUnitcode(unitCode);
    if (!unit)
      throw new Error404NotFound(`Unit with code ${unitCode} not found in DB`);

    // Check if the user has already reviewed this unit
    const existingReview = await ReviewRepository.findByAuthorAndUnit(
      reviewData.author,
      unit._id
    );

    if (existingReview) {
      throw new Error409Conflict('You have already reviewed this unit');
    }

    // Create and save the review
    const review = await ReviewRepository.create({
      ...reviewData,
      unit: unit._id,
    });

    // Add review to unit's reviews array
    await ReviewRepository.addReviewToUnit(unit._id, review._id);

    // Add review to user's reviews array
    await ReviewRepository.addReviewToUser(reviewData.author, review._id);

    // Recalculate and update unit averages
    await this._recalculateUnitAverages(unit._id);

    return review;
  };

  /**
   * Update a review by ID
   */
  static updateReview = async (reviewId, userId, updateData) => {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new Error404NotFound('Review not found');

    // Get the requesting user
    const requestingUser = await UserRepository.findById(userId);
    if (!requestingUser)
      throw new Error404NotFound('Requesting user not found');

    // Check authorization (must be author or admin)
    const isAuthor = review.author.toString() === requestingUser._id.toString();
    if (!isAuthor && !requestingUser.admin) {
      throw new Error401NotAuthorized('Unauthorized to update review');
    }

    // Update the review
    const updatedReview = await ReviewRepository.updateById(
      reviewId,
      updateData
    );

    // Recalculate unit averages
    await this._recalculateUnitAverages(review.unit);

    return updatedReview;
  };

  /**
   * Delete a review by ID
   */
  static deleteReview = async (reviewId, userId) => {
    const review = await ReviewRepository.findById(reviewId);
    if (!review) throw new Error404NotFound('Review not found');

    // Get the requesting user
    const requestingUser = await UserRepository.findById(userId);
    if (!requestingUser)
      throw new Error404NotFound('Requesting user not found');

    // Check authorization (must be author or admin)
    const isAuthor = review.author.toString() === requestingUser._id.toString();
    const isAdmin = requestingUser.admin;
    if (!isAuthor && !isAdmin) {
      throw new Error401NotAuthorized(
        'You are not authorized to delete this review'
      );
    }

    const unitId = review.unit;

    // Delete the review
    await ReviewRepository.deleteById(reviewId);

    // Remove review from user's reviews array
    await ReviewRepository.removeReviewFromUser(review.author, reviewId);

    // Remove review from unit's reviews array
    await ReviewRepository.removeReviewFromUnit(unitId, reviewId);

    // Recalculate unit averages
    await this._recalculateUnitAverages(unitId);
  };

  /**
   * Toggle like/dislike reaction on a review
   *
   * NOTE: NotificationService calls are not awaited, we let those happen in the
   * background to make this faster.
   */
  static toggleReaction = async (reviewId, userId, reactionType) => {
    const [user, review] = await Promise.all([
      UserRepository.findById(userId),
      ReviewRepository.findById(reviewId),
    ]);
    if (!review) throw new Error404NotFound('Review not found');
    if (!user) throw new Error404NotFound('User not found');

    const strReviewId = review._id.toString();
    const hasLiked = user.likedReviews
      .map((id) => id.toString())
      .includes(strReviewId);
    const hasDisliked = user.dislikedReviews
      .map((id) => id.toString())
      .includes(strReviewId);

    const operations = [];

    let likesDelta = 0;
    let dislikesDelta = 0;
    let finalHasLiked = hasLiked;
    let finalHasDisliked = hasDisliked;

    if (reactionType === 'like') {
      if (hasLiked) {
        // Action: Un-Like
        operations.push(ReviewRepository.decrementLikes(reviewId));
        operations.push(UserRepository.removeLikedReview(userId, reviewId));

        NotificationService.delete(review.author, reviewId);

        likesDelta = -1;
        finalHasLiked = false;
      } else {
        // Action: Like
        operations.push(ReviewRepository.incrementLikes(reviewId));
        operations.push(UserRepository.addLikedReview(userId, reviewId));

        NotificationService.createLike(user, review);

        likesDelta = 1;
        finalHasLiked = true;

        if (hasDisliked) {
          // If previously disliked, remove dislike
          operations.push(ReviewRepository.decrementDislikes(reviewId));
          operations.push(
            UserRepository.removeDislikedReview(userId, reviewId)
          );
          dislikesDelta = -1;
          finalHasDisliked = false;
        }
      }
    } else if (reactionType === 'dislike') {
      if (hasDisliked) {
        // Action: Un-Dislike
        operations.push(ReviewRepository.decrementDislikes(reviewId));
        operations.push(UserRepository.removeDislikedReview(userId, reviewId));

        dislikesDelta = -1;
        finalHasDisliked = false;
      } else {
        // Action: Dislike
        operations.push(ReviewRepository.incrementDislikes(reviewId));
        operations.push(UserRepository.addDislikedReview(userId, reviewId));

        dislikesDelta = 1;
        finalHasDisliked = true;

        if (hasLiked) {
          // if previously liked, remove like
          operations.push(ReviewRepository.decrementLikes(reviewId));
          operations.push(UserRepository.removeLikedReview(userId, reviewId));

          NotificationService.delete(review.author, reviewId);

          likesDelta = -1;
          finalHasLiked = false;
        }
      }
    }

    await Promise.all(operations);

    return {
      review: {
        ...review.toObject(),
        likes: review.likes + likesDelta,
        dislikes: review.dislikes + dislikesDelta,
      },
      reactions: {
        liked: finalHasLiked,
        disliked: finalHasDisliked,
      },
    };
  };

  /**
   * Private helper to recalculate and update unit rating averages
   */
  static _recalculateUnitAverages = async (unitId) => {
    const allReviews = await ReviewRepository.findByUnitId(unitId);

    const avgOverallRating = allReviews.length
      ? allReviews.reduce((sum, rev) => sum + rev.overallRating, 0) /
        allReviews.length
      : 0;
    const avgContentRating = allReviews.length
      ? allReviews.reduce((sum, rev) => sum + rev.contentRating, 0) /
        allReviews.length
      : 0;
    const avgFacultyRating = allReviews.length
      ? allReviews.reduce((sum, rev) => sum + rev.facultyRating, 0) /
        allReviews.length
      : 0;
    const avgRelevancyRating = allReviews.length
      ? allReviews.reduce((sum, rev) => sum + rev.relevancyRating, 0) /
        allReviews.length
      : 0;

    await UnitRepository.updateOneByUnitcode(unitId, {
      avgOverallRating,
      avgContentRating,
      avgFacultyRating,
      avgRelevancyRating,
    });
  };
}

export = ReviewService;
