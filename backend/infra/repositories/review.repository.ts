import Review from '@models/review';
import Unit from '@models/unit';
import User from '@models/user';

class ReviewRepository {
  /* -------------------------------- Retrieval ------------------------------- */

  /**
   * Find all reviews with optional filter
   */
  static async findAll(filter = {}) {
    return await Review.find(filter).populate('author');
  }

  /**
   * Find N most liked reviews
   */
  static async findMostLiked(n) {
    return await Review.find()
      .sort({ likes: -1 })
      .limit(n)
      .populate('author')
      .populate('unit');
  }

  /**
   * Find all reviews for a specific unit
   */
  static async findByUnitId(unitId) {
    return await Review.find({ unit: unitId });
  }

  /**
   * Find all reviews by a specific user
   */
  static async findByUserId(userId) {
    return await Review.find({ author: userId }).populate('unit');
  }

  /**
   * Find a review by a specific author for a specific unit
   */
  static async findByAuthorAndUnit(authorId, unitId) {
    return await Review.findOne({
      author: authorId,
      unit: unitId,
    });
  }

  /**
   * Find a review by ID
   */
  static async findById(reviewId) {
    return await Review.findById(reviewId);
  }

  /* -------------------------------- Creation -------------------------------- */

  /**
   * Create a new review
   */
  static async create(reviewData) {
    const review = new Review(reviewData);
    return await review.save();
  }

  /**
   * Add a review to a unit's reviews array
   */
  static async addReviewToUnit(unitId, reviewId) {
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
  static async addReviewToUser(userId, reviewId) {
    return await User.findByIdAndUpdate(
      userId,
      { $push: { reviews: reviewId } },
      { new: true, runValidators: true }
    );
  }

  /**
   * Update a review by ID
   */
  static async updateById(reviewId, updateData) {
    return await Review.findByIdAndUpdate(reviewId, updateData, { new: true });
  }

  /* --------------------------------- Removal -------------------------------- */

  /**
   * Delete a review by ID
   */
  static async deleteById(reviewId) {
    return await Review.findByIdAndDelete(reviewId);
  }

  /**
   * Remove a review from a user's reviews array
   */
  static async removeReviewFromUser(userId, reviewId) {
    return await User.findByIdAndUpdate(userId, {
      $pull: { reviews: reviewId },
    });
  }

  /**
   * Remove a review from a unit's reviews array
   */
  static async removeReviewFromUnit(unitId, reviewId) {
    return await Unit.findByIdAndUpdate(unitId, {
      $pull: { reviews: reviewId },
    });
  }

  /* -------------------------------- Reactions ------------------------------- */

  /**
   * Increment likes count for a review
   */
  static async incrementLikes(reviewId) {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { likes: 1 } },
      { new: true }
    );
  }

  /**
   * Decrement likes count for a review
   */
  static async decrementLikes(reviewId) {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { likes: -1 } },
      { new: true }
    );
  }

  /**
   * Increment dislikes count for a review
   */
  static async incrementDislikes(reviewId) {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { dislikes: 1 } },
      { new: true }
    );
  }

  /**
   * Decrement dislikes count for a review
   */
  static async decrementDislikes(reviewId) {
    return await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { dislikes: -1 } },
      { new: true }
    );
  }
}

export = ReviewRepository;
