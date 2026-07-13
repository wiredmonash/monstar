import { UnitRepository } from '@domains/academics/units';
import type { IReview } from '@domains/academics/reviews';
import { UserRepository } from '@domains/identity/users';
import type { IUser } from '@domains/identity/users';
import type { Id } from '@shared/types';
import { Error403Forbidden, Error404NotFound } from '@shared/errors/errors';

import NotificationRepository from './notification.repository';

class NotificationService {
  /**
   * List all notifications belonging to a user (populated, newest first)
   */
  static getForUser = async (userId: Id) => {
    return await NotificationRepository.findByUserId(userId);
  };

  /**
   * Delete a notification by its ID, enforcing that the requester owns it
   */
  static deleteById = async (notificationId: Id, requestingUserId: Id) => {
    const notification = await NotificationRepository.findById(notificationId);
    if (!notification) throw new Error404NotFound('Notification not found');

    if (notification.user?.toString() !== requestingUserId.toString())
      throw new Error403Forbidden(
        'You are not authorized to delete this notification'
      );

    await Promise.all([
      NotificationRepository.deleteById(notification._id),
      UserRepository.removeNotification(notification.user, notification._id),
    ]);
  };

  /**
   * Delete a notification
   */
  static delete = async (authorId: Id, reviewId: Id) => {
    const notification = await NotificationRepository.findByUserAndReview(
      authorId,
      reviewId
    );
    if (!notification) throw new Error404NotFound('Notification not found');
    await Promise.all([
      NotificationRepository.deleteById(notification._id),
      UserRepository.removeNotification(authorId, notification._id),
    ]);
  };

  /**
   * Create a "someone liked your review" notification
   */
  static createLike = async (liker: IUser, review: IReview) => {
    if (liker._id.toString() === review.author._id.toString()) return;

    const unit = await UnitRepository.findById(review.unit);
    if (!unit)
      throw new Error404NotFound(
        'The unit that this review was written for does not exist'
      );

    const newNotification = await NotificationRepository.create({
      data: {
        message: `${liker.username} liked your review on ${unit.unitCode.toUpperCase()}`,
        user: { username: liker.username, profileImg: liker.profileImg },
      },
      navigateTo: `/unit/${unit.unitCode}`,
      review: review._id,
      user: review.author,
    });
    await UserRepository.addNotification(review.author, newNotification._id);
    return newNotification;
  };
}

export default NotificationService;
