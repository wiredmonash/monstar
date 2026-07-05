import { User } from '@domains/identity/users';
import type { IUser } from '@domains/identity/users';
import type { Id } from '@shared/types';

import Notification from './notification.model';
import type { INotification } from './notification.types';

class NotificationRepository {
  /* -------------------------------- Retrieval ------------------------------- */

  /**
   * Find a notification by user and review
   */
  static async findByUserAndReview(userId: Id, reviewId: Id) {
    return await Notification.findOne({
      user: userId,
      review: reviewId,
    });
  }

  /**
   * Find a notification by ID
   */
  static async findById(notificationId: Id) {
    return await Notification.findById(notificationId);
  }

  /**
   * Find all notifications for a user
   */
  static async findByUserId(userId: Id) {
    return await Notification.find({ user: userId })
      .populate('review')
      .sort({ createdAt: -1 });
  }

  /**
   * Find all notifications for a given user document (v1 raw query)
   *
   * NOTE: preserves v1 behavior — receives the USER DOCUMENT (or null) and
   * passes it straight into the filter; mongoose casts the doc to its _id, and a
   * null user matches { user: null }. Intentionally omits the populate/sort that
   * findByUserId applies, to mirror the original endpoint exactly.
   */
  static async findByUser(user: IUser | null) {
    return await Notification.find({ user });
  }

  /**
   * Find a user by ID (cross-model lookup for v1 ownership checks)
   *
   * Mirrors the cross-model access pattern used in review.repository.ts.
   */
  static async findUserById(userId: Id | null | undefined) {
    return await User.findById(userId);
  }

  /* -------------------------------- Creation -------------------------------- */

  /**
   * Create a new notification
   */
  static async create(notificationData: Partial<INotification>) {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  /* --------------------------------- Removal -------------------------------- */

  /**
   * Delete a notification by ID
   */
  static async deleteById(notificationId: Id) {
    return await Notification.findByIdAndDelete(notificationId);
  }

  /**
   * Delete a single notification by ID via deleteOne (v1 behavior)
   *
   * NOTE: preserves v1 behavior — uses deleteOne (not findByIdAndDelete like
   * deleteById) to mirror the original delete call exactly.
   */
  static async deleteOneById(notificationId: Id) {
    return await Notification.deleteOne({ _id: notificationId });
  }
}

export default NotificationRepository;
