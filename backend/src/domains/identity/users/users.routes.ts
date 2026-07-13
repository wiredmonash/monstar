import express from 'express';
import multer from 'multer';

import UserController from './user.controller';
import userMiddleware from './user.middleware';
import adminMiddleware from './admin.middleware';
import { storage } from '@infrastructure/storage/cloudinary';

const upload = multer({ storage });
const router = express.Router();

router.get(
  '/',
  adminMiddleware,
  // #swagger.tags = ['User']
  // #swagger.summary = 'Get all users (admin only)'
  UserController.getAllUsers
);

router.get(
  '/me',
  // #swagger.tags = ['User']
  // #swagger.summary = 'Get current user'
  userMiddleware,
  UserController.me
);

router.get(
  '/validate',
  // #swagger.tags = ['User']
  // #swagger.summary = 'Check if the user has the access_token in their cookies to keep session'
  UserController.validate
);

router.post(
  '/google/authenticate',
  // #swagger.tags = ['User']
  // #swagger.summary = 'Login/register a user with Google OAuth'
  UserController.authenticateWithGoogle
);

router.post(
  '/refresh',
  // #swagger.tags = ['User']
  // #swagger.summary = 'Refresh access token using refresh token'
  UserController.refresh
);

router.post(
  '/logout',
  userMiddleware,
  // #swagger.tags = ['User']
  // #swagger.summary = 'Clear the token cookies and invalidate refresh token in database'
  UserController.logout
);

router.post(
  '/upload-avatar',
  userMiddleware,
  upload.single('avatar'),
  // #swagger.tags = ['User']
  // #swagger.summary = 'Upload avatar to cloudinary and assign it as user's profileImg'
  UserController.uploadAvatar
);

router.put(
  '/update/:userId',
  userMiddleware,
  // #swagger.tags = ['User']
  // #swagger.summary = 'Update a user's username (only admins or the user themselves)'
  UserController.updateUser
);

router.delete(
  '/delete/:userId',
  userMiddleware,
  // #swagger.tags = ['User']
  // #swagger.summary = 'Delete a user account (only admins or the user themselves)'
  UserController.deleteUser
);

router.get(
  '/:username',
  // #swagger.tags = ['User']
  // #swagger.summary = 'Get user by username'
  UserController.getByUsername
);

export default router;
