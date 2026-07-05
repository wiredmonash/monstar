import type { FilterQuery, UpdateQuery } from 'mongoose';

import { Unit } from '@domains/academics/units';
import { User } from '@domains/identity/users';
import type { IUser } from '@domains/identity/users';
import type { Id } from '@shared/types';

import Review from './review.model';
import type { IReview } from './review.types';

class ReviewRepository {
  /* -------------------------------- Retrieval ------------------------------- */

  /**
   * Find all reviews with optional filter
   */
  static async findAll(filter: FilterQuery<IReview> = {}) {
    return await Review.find(filter).populate('author');
  }

  /**
   * Find N most liked reviews
   */
  static async findMostLiked(n: number) {
    return await Review.find()
      .sort({ likes: -1 })
      .limit(n)
      .populate('author')
      .populate('unit');
  }

  /**
   * Find all reviews for a specific unit
   */
  static async findByUnitId(unitId: Id) {
    return await Review.find({ unit: unitId });
  }

  /**
   * Find all reviews by a specific user
   */
  static async findByUserId(userId: Id) {
    return await Review.find({ author: userId }).populate('unit');
  }

  /**
   * Find all reviews by a specific user, populating BOTH unit and author.
   *
   * Distinct from {@link findByUserId} (which populates only `unit`): v1's
   * GET /reviews/user/:userId populates the author too.
   */
  static async findByUserIdPopulated(userId: Id) {
    return await Review.find({ author: userId })
      .populate('unit')
      .populate('author');
  }

  /**
   * Find a review by a specific author for a specific unit
   */
  static async findByAuthorAndUnit(authorId: Id, unitId: Id) {
    return await Review.findOne({
      author: authorId,
      unit: unitId,
    });
  }

  /**
   * Find a review by ID
   */
  static async findById(reviewId: Id) {
    return await Review.findById(reviewId);
  }

  /* -------------------------------- Creation -------------------------------- */

  /**
   * Create a new review
   */
  static async create(reviewData: Partial<IReview>) {
    const review = new Review(reviewData);
    return await review.save();
  }

  /**
   * Add a review to a unit's reviews array
   */
  static async addReviewToUnit(unitId: Id, reviewId: Id) {
    return await Unit.findByIdAndUpdate(
      unitId,
      { $push: { reviews: reviewId } },
      { new: true, runValidators: true }
    );
  }

  /* ------------------------------ Modification ------------------------------ */

  /**
   * Add a review to a user's reviews array
   */
  static async addReviewToUser(userId: Id, reviewId: Id) {
    return await User.findByIdAndUpdate(
      userId,
      { $push: { reviews: reviewId } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Update a review by ID
   */
  static async updateById(reviewId: Id, updateData: UpdateQuery<IReview>) {
    return await Review.findByIdAndUpdate(reviewId, updateData, { new: true });
  }

  /**
   * Overwrite a unit's rating averages, matching the unit by a raw `_id`.
   *
   * Takes whatever id the caller supplies as the `_id` filter and uses a plain
   * `updateOne` (no validators) — v1's create/update handlers recalculate
   * averages this way. The PUT /update handler deliberately passes a REVIEW id
   * here, so this must NOT assume the id refers to a real unit.
   */
  static async updateUnitAveragesById(
    id: Id,
    averages: {
      avgOverallRating: number;
      avgContentRating: number;
      avgFacultyRating: number;
      avgRelevancyRating: number;
    }
  ) {
    return await Unit.updateOne({ _id: id }, averages);
  }

  /* --------------------------------- Removal -------------------------------- */

  /**
   * Delete a review by ID
   */
  static async deleteById(reviewId: Id) {
    return await Review.findByIdAndDelete(reviewId);
  }

  /**
   * Remove a review from a user's reviews array
   */
  static async removeReviewFromUser(userId: Id, reviewId: Id) {
    return await User.findByIdAndUpdate(userId, {
      $pull: { reviews: reviewId },
    });
  }

  /**
   * Remove a review from a unit's reviews array
   */
  static async removeReviewFromUnit(unitId: Id, reviewId: Id) {
    return await Unit.findByIdAndUpdate(unitId, {
      $pull: { reviews: reviewId },
    });
  }

  /* -------------------------------- Reactions ------------------------------- */

  /**
   * Increment likes count for a review
   */
  static async incrementLikes(reviewId: Id) {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { likes: 1 } },
      { new: true }
    );
  }

  /**
   * Decrement likes count for a review
   */
  static async decrementLikes(reviewId: Id) {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { likes: -1 } },
      { new: true }
    );
  }

  /**
   * Increment dislikes count for a review
   */
  static async incrementDislikes(reviewId: Id) {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { dislikes: 1 } },
      { new: true }
    );
  }

  /**
   * Decrement dislikes count for a review
   */
  static async decrementDislikes(reviewId: Id) {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { dislikes: -1 } },
      { new: true }
    );
  }

  /* ------------------------------- Persistence ------------------------------ */

  /**
   * Persist an in-memory review document.
   *
   * v1's toggle-reaction handler mutates a loaded document (with `Math.max`
   * floors) and calls `.save()`, which also runs the description pre-save hook.
   */
  static async save(review: IReview) {
    return await review.save();
  }

  /**
   * Persist an in-memory user document.
   *
   * Sibling of the existing cross-domain User writers on this repository
   * (`addReviewToUser` etc.); used by v1's toggle-reaction unit-of-work to save
   * the reacting user and the review author after their arrays are mutated.
   */
  static async saveUser(user: IUser) {
    return await user.save();
  }
}

export default ReviewRepository;
