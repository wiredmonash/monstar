import Notification from '@models/notification';

class NotificationRepository {
  /* -------------------------------- Retrieval ------------------------------- */

  /**
   * Find a notification by user and review
   */
  static async findByUserAndReview(userId, reviewId) {
    return await Notification.findOne({
      user: userId,
      review: reviewId,
    });
  }

  /**
   * Find a notification by ID
   */
  static async findById(notificationId) {
    return await Notification.findById(notificationId);
  }

  /**
   * Find all notifications for a user
   */
  static async findByUserId(userId) {
    return await Notification.find({ user: userId })
      .populate('review')
      .sort({ createdAt: -1 });
  }

  /* -------------------------------- Creation -------------------------------- */

  /**
   * Create a new notification
   */
  static async create(notificationData) {
    const notification = new Notification(notificationData);
    return await notification.save();
  }

  /* --------------------------------- Removal -------------------------------- */

  /**
   * Delete a notification by ID
   */
  static async deleteById(notificationId) {
    return await Notification.findByIdAndDelete(notificationId);
  }
}

export = NotificationRepository;
