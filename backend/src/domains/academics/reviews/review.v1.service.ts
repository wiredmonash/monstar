import { Types } from 'mongoose';
import type { FilterQuery, UpdateQuery } from 'mongoose';

import { UnitRepository } from '@domains/academics/units';
import type { IUnit } from '@domains/academics/units';
import { NotificationRepository } from '@domains/identity/notifications';
import type { INotification } from '@domains/identity/notifications';
import { UserRepository } from '@domains/identity/users';
import type { IUser } from '@domains/identity/users';
import type { Id } from '@shared/types';

import ReviewRepository from './review.repository';
import type { IReview } from './review.types';

type UnitAverages = {
  avgOverallRating: number;
  avgContentRating: number;
  avgFacultyRating: number;
  avgRelevancyRating: number;
};

/**
 * v1-only business logic for the reviews endpoints. Isolated from the v2
 * {@link ReviewService} so v1 can be deleted wholesale once retired. Handlers
 * own the HTTP responses (see {@link ReviewV1Controller}); this layer performs
 * the data-access orchestration and multi-step side effects, preserving v1
 * behaviour exactly (including its quirks and bugs).
 */
class ReviewV1Service {
  /* --------------------------------- Reads ---------------------------------- */

  /**
   * Fetch all reviews matching an optional filter (populates author).
   */
  static fetchAll = async (filter: FilterQuery<IReview> = {}) => {
    return await ReviewRepository.findAll(filter);
  };

  /**
   * Fetch all reviews for a unit id (populates author).
   */
  static fetchReviewsByUnitId = async (unitId: Id) => {
    return await ReviewRepository.findAll({ unit: unitId });
  };

  /**
   * Fetch all reviews by a user, populating both unit and author.
   */
  static fetchByUserPopulated = async (userId: Id) => {
    return await ReviewRepository.findByUserIdPopulated(userId);
  };

  /**
   * Find a unit by its unit code.
   */
  static findUnitByCode = async (unitCode: string) => {
    return await UnitRepository.findOneByUnitcode(unitCode);
  };

  /**
   * Find a unit by id.
   */
  static findUnitById = async (unitId: Id) => {
    return await UnitRepository.findById(unitId);
  };

  /**
   * Find a review by id.
   */
  static findReviewById = async (reviewId: Id) => {
    return await ReviewRepository.findById(reviewId);
  };

  /**
   * Find an existing review by the same author for the same unit.
   */
  static findReviewByAuthorAndUnit = async (authorId: Id, unitId: Id) => {
    return await ReviewRepository.findByAuthorAndUnit(authorId, unitId);
  };

  /**
   * Find a user by id.
   */
  static findUserById = async (userId: Id) => {
    return await UserRepository.findById(userId);
  };

  /* -------------------------------- Mutations ------------------------------- */

  /**
   * Create a review for a unit, mirror it into the unit's and author's `reviews`
   * arrays, then recalculate the unit averages.
   */
  static createReview = async (unit: IUnit, reviewData: Partial<IReview>) => {
    const review = await ReviewRepository.create({
      ...reviewData,
      unit: unit._id,
    });

    await ReviewRepository.addReviewToUnit(unit._id, review._id);
    await ReviewRepository.addReviewToUser(review.author, review._id);

    const allReviews = await ReviewRepository.findByUnitId(unit._id);
    // NOTE: preserves v1 behavior — averages use no divide-by-zero guard.
    const averages = this._computeAveragesNoGuard(allReviews);
    await ReviewRepository.updateUnitAveragesById(unit._id, averages);

    return review;
  };

  /**
   * Update a review, then recalculate unit averages.
   */
  static applyUpdate = async (
    review: IReview,
    updateData: UpdateQuery<IReview>
  ) => {
    const updatedReview = await ReviewRepository.updateById(
      review._id,
      updateData
    );

    const allReviews = await ReviewRepository.findByUnitId(review.unit);
    // NOTE: preserves v1 behavior — averages use no divide-by-zero guard.
    const averages = this._computeAveragesNoGuard(allReviews);
    // NOTE: preserves v1 behavior — averages are written keyed by the REVIEW id
    // (review._id), not the unit id, so they match no unit (a silent no-op).
    await ReviewRepository.updateUnitAveragesById(review._id, averages);

    return updatedReview;
  };

  /**
   * Delete a review, remove it from the author's and unit's `reviews` arrays,
   * then recalculate the unit averages if the unit still exists.
   */
  static applyDelete = async (review: IReview) => {
    const unitId = review.unit;

    await ReviewRepository.deleteById(review._id);
    await ReviewRepository.removeReviewFromUser(review.author, review._id);
    await ReviewRepository.removeReviewFromUnit(unitId, review._id);

    const unit = await UnitRepository.findById(unitId);
    if (unit) {
      const allReviews = await ReviewRepository.findByUnitId(unit._id);
      const averages = this._computeAveragesGuarded(allReviews);
      await ReviewRepository.updateUnitAveragesById(unit._id, averages);
    }
  };

  /**
   * Toggle a like/dislike reaction on a review.
   *
   * NOTE: preserves v1 behavior — mutates loaded documents in place with
   * `Math.max(0, ...)` floors, creates/deletes the author notification
   * synchronously while maintaining `author.notifications`, saves all three
   * documents, and returns the reaction state from the SAVED documents. This is
   * deliberately NOT delegated to the v2 {@link ReviewService.toggleReaction},
   * which differs (fire-and-forget notifications, delta-based response).
   */
  static applyReaction = async (
    review: IReview,
    user: IUser,
    unit: IUnit,
    author: IUser,
    reactionType: string
  ) => {
    // Initialize operations object to track changes
    const operations: {
      notificationToRemove: INotification | null;
      notificationToAdd: Partial<INotification> | null;
      reactionAdded: boolean;
      reactionRemoved: boolean;
      oppositeReactionRemoved: boolean;
    } = {
      notificationToRemove: null,
      notificationToAdd: null,
      reactionAdded: false,
      reactionRemoved: false,
      oppositeReactionRemoved: false,
    };

    // Handle like/dislike toggle
    if (reactionType === 'like') {
      // Check if user already liked this review
      const hasLiked = user.likedReviews.includes(review._id);

      if (hasLiked) {
        // Remove like
        review.likes = Math.max(0, review.likes - 1);
        (user.likedReviews as Types.Array<Types.ObjectId>).pull(review._id);
        operations.reactionRemoved = true;

        // Find and mark notification for removal
        operations.notificationToRemove =
          await NotificationRepository.findByUserAndReview(
            author._id,
            review._id
          );
      } else {
        // Add like
        review.likes++;
        user.likedReviews.push(review._id);
        operations.reactionAdded = true;

        // Create notification data
        operations.notificationToAdd = {
          data: {
            message: `${user.username} liked your review on ${unit.unitCode.toUpperCase()}`,
            user: { username: user.username, profileImg: user.profileImg },
          },
          navigateTo: `/unit/${unit.unitCode}`,
          review: review._id,
          user: author._id,
        };

        // Check if user had disliked this review
        if (user.dislikedReviews.includes(review._id)) {
          // Remove the dislike
          review.dislikes = Math.max(0, review.dislikes - 1);
          (user.dislikedReviews as Types.Array<Types.ObjectId>).pull(
            review._id
          );
          operations.oppositeReactionRemoved = true;
        }
      }
    } else {
      // dislike
      // Check if user already disliked this review
      const hasDisliked = user.dislikedReviews.includes(review._id);

      if (hasDisliked) {
        // Remove dislike
        review.dislikes = Math.max(0, review.dislikes - 1);
        (user.dislikedReviews as Types.Array<Types.ObjectId>).pull(review._id);
        operations.reactionRemoved = true;
      } else {
        // Add dislike
        review.dislikes++;
        user.dislikedReviews.push(review._id);
        operations.reactionAdded = true;

        // Check if user had liked this review
        if (user.likedReviews.includes(review._id)) {
          // Remove the like
          review.likes = Math.max(0, review.likes - 1);
          (user.likedReviews as Types.Array<Types.ObjectId>).pull(review._id);
          operations.oppositeReactionRemoved = true;

          // Find and mark notification for removal
          operations.notificationToRemove =
            await NotificationRepository.findByUserAndReview(
              author._id,
              review._id
            );
        }
      }
    }

    // Process notifications
    if (operations.notificationToRemove) {
      await NotificationRepository.deleteById(
        operations.notificationToRemove._id
      );

      if (
        author.notifications &&
        author.notifications.includes(operations.notificationToRemove._id)
      ) {
        (author.notifications as Types.Array<Types.ObjectId>).pull(
          operations.notificationToRemove._id
        );
      }
    }

    if (operations.notificationToAdd) {
      const newNotification = await NotificationRepository.create(
        operations.notificationToAdd
      );

      // Ensure author.notifications is initialized
      if (!author.notifications) {
        author.notifications = [];
      }
      author.notifications.push(newNotification._id);
    }

    // Save all documents in parallel
    await Promise.all([
      ReviewRepository.save(review),
      ReviewRepository.saveUser(user),
      ReviewRepository.saveUser(author),
    ]);

    // Return the updated review with reaction status
    return {
      review,
      reactions: {
        liked: user.likedReviews.includes(review._id),
        disliked: user.dislikedReviews.includes(review._id),
      },
    };
  };

  /* --------------------------------- Helpers -------------------------------- */

  /**
   * Compute unit rating averages WITHOUT a divide-by-zero guard (v1's
   * create/update behaviour — an empty list yields NaN).
   */
  static _computeAveragesNoGuard = (reviews: IReview[]): UnitAverages => {
    return {
      avgOverallRating:
        reviews.reduce((sum, rev) => sum + rev.overallRating, 0) /
        reviews.length,
      avgContentRating:
        reviews.reduce((sum, rev) => sum + rev.contentRating, 0) /
        reviews.length,
      avgFacultyRating:
        reviews.reduce((sum, rev) => sum + rev.facultyRating, 0) /
        reviews.length,
      avgRelevancyRating:
        reviews.reduce((sum, rev) => sum + rev.relevancyRating, 0) /
        reviews.length,
    };
  };

  /**
   * Compute unit rating averages WITH a divide-by-zero guard (v1's delete
   * behaviour — an empty list yields 0).
   */
  static _computeAveragesGuarded = (reviews: IReview[]): UnitAverages => {
    return {
      avgOverallRating: reviews.length
        ? reviews.reduce((sum, rev) => sum + rev.overallRating, 0) /
          reviews.length
        : 0,
      avgContentRating: reviews.length
        ? reviews.reduce((sum, rev) => sum + rev.contentRating, 0) /
          reviews.length
        : 0,
      avgFacultyRating: reviews.length
        ? reviews.reduce((sum, rev) => sum + rev.facultyRating, 0) /
          reviews.length
        : 0,
      avgRelevancyRating: reviews.length
        ? reviews.reduce((sum, rev) => sum + rev.relevancyRating, 0) /
          reviews.length
        : 0,
    };
  };
}

export default ReviewV1Service;
