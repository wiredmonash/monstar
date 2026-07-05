import express from 'express';

import { verifyToken } from '@domains/identity/users';

import NotificationV1Controller from './notification.v1.controller';

const router = express.Router();

router.get(
  '/user/:userId',
  verifyToken,
  // #swagger.tags = ['Notifications']
  // #swagger.summary = 'Get all notifications for a user from the database'
  NotificationV1Controller.getByUser
);

router.delete(
  '/:notificationId',
  verifyToken,
  // #swagger.tags = ['Notifications']
  // #swagger.summary = 'Delete a user notification'
  NotificationV1Controller.deleteNotification
);

// Export the router
export default router;
