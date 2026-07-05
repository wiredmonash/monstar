import type { Types } from 'mongoose';

import type { IUser } from '@domains/identity/users';
import type { Id } from '@shared/types';

import NotificationRepository from './notification.repository';
import type { INotification } from './notification.types';

/**
 * v1-only orchestration for the legacy notifications endpoints. Kept separate
 * from NotificationService so the current-API service stays clean while these
 * routes preserve their exact v1 behavior.
 */
class NotificationV1Service {
  /**
   * Fetch every notification belonging to a user (v1 two-step lookup).
   */
  static async getNotificationsForUser(userId: Id) {
    const user = await NotificationRepository.findUserById(userId);
    // console.log(`Fetching notifications for user: ${user}`);

    // Find all notifications associated with this user
    // NOTE: preserves v1 behavior — passes the USER DOCUMENT (not its id) into
    // the query; mongoose casts doc->_id, and a null user matches { user: null }.
    const notifications = await NotificationRepository.findByUser(user);
    // console.log(`Found ${notifications.length} notifications`);
    // console.log({notifications})

    return notifications;
  }

  /**
   * Find a single notification by ID.
   */
  static async findById(notificationId: Id) {
    return await NotificationRepository.findById(notificationId);
  }

  /**
   * Find the user that owns a notification.
   */
  static async findUserById(userId: Id | null | undefined) {
    return await NotificationRepository.findUserById(userId);
  }

  /**
   * Remove a notification from its owner and delete it.
   */
  static async removeNotificationFromUser(
    user: IUser,
    notification: INotification
  ) {
    // NOTE: preserves v1 behavior — pull from the user's notifications array,
    // then deleteOne the notification, then save the user, in that exact order.
    (user.notifications as Types.Array<Types.ObjectId>).pull(notification._id);
    // console.log("user updated");
    await NotificationRepository.deleteOneById(notification._id);
    // console.log("notification deleted");
    await user.save();
  }
}

export default NotificationV1Service;
