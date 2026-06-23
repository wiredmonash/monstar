import type { Id, IReview, IUser } from '@models/types';
import NotificationRepository from '@repositories/notification.repository';
import UnitRepository from '@repositories/unit.repository';
import UserRepository from '@repositories/user.repository';
import { Error404NotFound } from '@utilities/errors';

class NotificationService {
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

export = NotificationService;
