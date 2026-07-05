import type { Request, Response } from 'express';

import { getErrorMessage } from '@shared/utilities/getErrorMessage';

import NotificationV1Service from './notification.v1.service';

/**
 * Controllers for the legacy v1 notifications endpoints. Explicit try/catch per
 * handler reproduces the exact v1 status codes and JSON payloads.
 */
class NotificationV1Controller {
  /**
   * GET /user/:userId — list all notifications for the authenticated user.
   */
  static async getByUser(req: Request, res: Response) {
    try {
      const userId = req.params.userId;

      if (!req.user) {
        return res.status(401).json({ error: 'You are not authenticated' });
      }

      // Check if the authenticated user is requesting their own notifications
      if (req.user.id !== userId) {
        return res
          .status(403)
          .json({ error: 'Unauthorized to view these notifications' });
      }

      const notifications =
        await NotificationV1Service.getNotificationsForUser(userId);

      // Return the list of reviews with a 200 OK status
      return res.status(200).json(notifications);
    } catch (error) {
      // Handle any errors that occur during the process
      console.error(`An error occurred: ${getErrorMessage(error)}`);
      // NOTE: preserves v1 behavior — the misspelled "notificatons" in the message
      return res.status(500).json({
        error: `An error occurred while fetching notificatons: ${getErrorMessage(error)}`,
      });
    }
  }

  /**
   * DELETE /:notificationId — remove a notification owned by the user.
   */
  static async deleteNotification(req: Request, res: Response) {
    try {
      console.log('deleting notification');
      const notificationId = req.params.notificationId;

      // Find the notification
      const notification = await NotificationV1Service.findById(notificationId);

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Find the user
      const user = await NotificationV1Service.findUserById(notification.user);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!req.user) {
        return res.status(401).json({ error: 'You are not authenticated' });
      }

      console.log('checking if current user is owner');
      // NOTE: preserves v1 behavior — ownership mismatch returns 404 (not 403),
      // using loose != exactly as the original did.
      if (req.user.id != user._id.toString()) {
        return res
          .status(404)
          .json({ error: 'No permissions to remove notification' });
      }

      await NotificationV1Service.removeNotificationFromUser(
        user,
        notification
      );

      // Respond 200 and json with success message
      return res
        .status(200)
        .json({ message: 'Notification successfully deleted' });
    } catch (error) {
      // Respond 500 and error message
      return res.status(500).json({
        error: `Error while deleting notification: ${getErrorMessage(error)}`,
      });
    }
  }
}

export default NotificationV1Controller;
