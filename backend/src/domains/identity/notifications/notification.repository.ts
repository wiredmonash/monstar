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
}

export default NotificationRepository;
