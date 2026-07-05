import express from 'express';
import multer from 'multer';

import { storage } from '@infrastructure/storage/cloudinary';

import AuthV1Controller from './auth.v1.controller';
import { verifyToken, verifyAdmin } from './auth.middleware';

const upload = multer({ storage });
const router = express.Router();

router.post(
  '/google/authenticate',
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Login and/or register a user using Google OAuth'
  AuthV1Controller.authenticateWithGoogle
);

router.post(
  '/refresh',
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Refresh access token using refresh token'
  AuthV1Controller.refresh
);

router.get(
  '/',
  verifyAdmin,
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Get all users from the database'
  AuthV1Controller.getAllUsers
);

router.delete(
  '/delete/:userId',
  verifyToken,
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Delete a user from the database (Only admins or the user themselves can delete accounts)'
  AuthV1Controller.deleteUser
);

router.post(
  '/logout',
  verifyToken,
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Clear the token cookies and invalidate refresh token in database'
  AuthV1Controller.logout
);

router.put(
  '/update/:userId',
  verifyToken,
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Update user\'s username and/or password (Only admins or the user themselves can update account details)'
  AuthV1Controller.updateUser
);

router.get(
  '/validate',
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Check if the user has the access_token in their cookies to keep session'
  AuthV1Controller.validate
);

router.post(
  '/upload-avatar',
  verifyToken,
  upload.single('avatar'),
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Upload the given avatar to cloudinary and assign it as user\'s profileImg'
  AuthV1Controller.uploadAvatar
);

export default router;
