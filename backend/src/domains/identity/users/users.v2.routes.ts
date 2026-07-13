import express from 'express';
import multer from 'multer';

import UserController from './user.controller';
import userMiddleware from './user.middleware';
import { storage } from '@infrastructure/storage/cloudinary';

const upload = multer({ storage });
const router = express.Router();

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

router.get(
  '/:username',
  // #swagger.tags = ['User']
  // #swagger.summary = 'Get user by username'
  UserController.getByUsername
);

export default router;
