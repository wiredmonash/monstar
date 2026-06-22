import express from 'express';
import multer from 'multer';

import UserController from '@controllers/user.controller';
import userMiddleware from '@middleware/user.middleware';
import { storage } from '@providers/cloudinary.provider';

const upload = multer({ storage });
const router = express.Router();

router.get(
  '/me',
  // #swagger.tags = ['User V2']
  // #swagger.summary = 'Get current user'
  userMiddleware,
  UserController.me
);

router.get(
  '/validate',
  // #swagger.tags = ['User V2']
  // #swagger.summary = 'Check if the user has the access_token in their cookies to keep session'
  UserController.validate
);

router.post(
  '/google/authenticate',
  // #swagger.tags = ['User V2']
  // #swagger.summary = 'Login/register a user with Google OAuth'
  UserController.authenticateWithGoogle
);

router.post(
  '/refresh',
  // #swagger.tags = ['User V2']
  // #swagger.summary = 'Refresh access token using refresh token'
  UserController.refresh
);

router.post(
  '/logout',
  userMiddleware,
  // #swagger.tags = ['User V2']
  // #swagger.summary = 'Clear the token cookies and invalidate refresh token in database'
  UserController.logout
);

router.post(
  '/upload-avatar',
  userMiddleware,
  upload.single('avatar'),
  // #swagger.tags = ['User V2']
  // #swagger.summary = 'Upload avatar to cloudinary and assign it as user's profileImg'
  UserController.uploadAvatar
);

router.get(
  '/:username',
  // #swagger.tags = ['User v2']
  // #swagger.summary = 'Get user by username'
  UserController.getByUsername
);

export = router;
