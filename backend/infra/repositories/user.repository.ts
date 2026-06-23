import type { Types } from 'mongoose';

import User from '@models/user';
import type { Id, IUser } from '@models/types';

class UserRepository {
  /* -------------------------------- Retrieval ------------------------------- */

  /**
   * Find a user by ID
   */
  static async findById(userId: Id) {
    return await User.findById(userId);
  }

  /**
   * Find a user by email or google id
   */
  static async findByEmailOrGoogleId(email: string, googleId: string) {
    return await User.findOne({
      $or: [{ email: email }, { googleId: googleId }],
    });
  }

  /**
   * Find a user by username (excludes sensitive fields)
   */
  static async findByUsername(username: string) {
    return await User.findOne(
      { username },
      {
        password: 0,
        refreshToken: 0,
        refreshTokenExpires: 0,
        verificationToken: 0,
        verificationTokenExpires: 0,
        resetPasswordToken: 0,
        resetPasswordExpires: 0,
        googleID: 0,
      }
    );
  }

  /* -------------------------------- Creation -------------------------------- */

  /**
   * Create a user
   */
  static async create(userData: Partial<IUser>) {
    const user = new User(userData);
    return await user.save();
  }

  /* ------------------------------ Modification ------------------------------ */

  /**
   * Update user's profile image
   */
  static async updateProfileImage(userId: Id, profileImgUrl: string) {
    return await User.findByIdAndUpdate(
      userId,
      { profileImg: profileImgUrl },
      { new: true }
    );
  }

  /* ----------------------------- Authentication ----------------------------- */

  /**
   * Update the refresh token of a user
   */
  static async updateRefreshToken(
    userId: Id,
    hashedToken: string,
    expiry: Date | number
  ) {
    return await User.findByIdAndUpdate(
      userId,
      {
        refreshToken: hashedToken,
        refreshTokenExpires: expiry,
      },
      { new: true }
    );
  }

  /**
   * Find a user by their hashed refresh token
   */
  static async findByHashedRefreshToken(hashedRefreshToken: string) {
    return await User.findOne({
      refreshToken: hashedRefreshToken,
      refreshTokenExpires: { $gt: Date.now() },
    });
  }

  /**
   * Unsets the refreshToken and expiry fields
   */
  static async invalidateRefreshToken(userId: Id) {
    return await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1, refreshTokenExpires: 1 },
    });
  }

  /* -------------------------------- Reactions ------------------------------- */

  /**
   * Add a review to user's liked reviews
   */
  static async addLikedReview(userId: Id, reviewId: Id) {
    return await User.findByIdAndUpdate(
      userId,
      { $addToSet: { likedReviews: reviewId } },
      { new: true }
    );
  }

  /**
   * Remove a review from user's liked reviews
   */
  static async removeLikedReview(userId: Id, reviewId: Id) {
    return await User.findByIdAndUpdate(
      userId,
      { $pull: { likedReviews: reviewId } },
      { new: true }
    );
  }

  /**
   * Add a review to user's disliked reviews
   */
  static async addDislikedReview(userId: Id, reviewId: Id) {
    return await User.findByIdAndUpdate(
      userId,
      { $addToSet: { dislikedReviews: reviewId } },
      { new: true }
    );
  }

  /**
   * Remove a review from user's disliked reviews
   */
  static async removeDislikedReview(userId: Id, reviewId: Id) {
    return await User.findByIdAndUpdate(
      userId,
      { $pull: { dislikedReviews: reviewId } },
      { new: true }
    );
  }

  /**
   * Check if user has liked a review
   */
  static async hasLikedReview(userId: Id, reviewId: Id) {
    const user = await User.findById(userId, { likedReviews: 1 });
    return user
      ? user.likedReviews.includes(reviewId as Types.ObjectId)
      : false;
  }

  /**
   * Check if user has disliked a review
   */
  static async hasDislikedReview(userId: Id, reviewId: Id) {
    const user = await User.findById(userId, { dislikedReviews: 1 });
    return user
      ? user.dislikedReviews.includes(reviewId as Types.ObjectId)
      : false;
  }

  /* ------------------------------ Notifications ----------------------------- */

  /**
   * Add a notification to user's notifications array
   */
  static async addNotification(userId: Id, notificationId: Id) {
    return await User.findByIdAndUpdate(
      userId,
      { $addToSet: { notifications: notificationId } },
      { new: true }
    );
  }

  /**
   * Remove a notification from user's notifications array
   */
  static async removeNotification(userId: Id, notificationId: Id) {
    return await User.findByIdAndUpdate(
      userId,
      { $pull: { notifications: notificationId } },
      { new: true }
    );
  }
}

export default UserRepository;
