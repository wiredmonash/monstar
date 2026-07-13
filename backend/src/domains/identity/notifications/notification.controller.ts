import asyncHandler from '@shared/utilities/asyncHandler';

import NotificationService from './notification.service';

class NotificationController {
  /**
   * Get all notifications for the authenticated user
   */
  static getByUser = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }
    if (req.user.id !== req.params.userId) {
      return res
        .status(403)
        .json({ error: 'Unauthorized to view these notifications' });
    }

    const notifications = await NotificationService.getForUser(
      req.params.userId
    );
    return res.status(200).json(notifications);
  });

  /**
   * Delete a notification owned by the authenticated user
   */
  static deleteNotification = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }

    await NotificationService.deleteById(
      req.params.notificationId,
      req.user.id
    );
    return res
      .status(200)
      .json({ message: 'Notification successfully deleted' });
  });
}

export default NotificationController;
