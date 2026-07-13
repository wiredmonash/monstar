import express from 'express';

import { userMiddleware } from '@domains/identity/users';

import NotificationController from './notification.controller';

const router = express.Router();

router.get(
  '/user/:userId',
  userMiddleware,
  // #swagger.tags = ['Notifications']
  // #swagger.summary = 'Get all notifications for a user'
  NotificationController.getByUser
);

router.delete(
  '/:notificationId',
  userMiddleware,
  // #swagger.tags = ['Notifications']
  // #swagger.summary = 'Delete a user notification'
  NotificationController.deleteNotification
);

export default router;
