import express from 'express';

import AuthV1Controller from './auth.v1.controller';
import { verifyToken, verifyAdmin } from './auth.middleware';

const router = express.Router();

// google/authenticate, /validate, /upload-avatar, /refresh and /logout were
// removed once the frontend moved to their /api/v2/users equivalents. The
// remaining user-management endpoints have no v2 replacement yet.
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

router.put(
  '/update/:userId',
  verifyToken,
  // #swagger.tags = ['Auth']
  // #swagger.summary = 'Update user\'s username and/or password (Only admins or the user themselves can update account details)'
  AuthV1Controller.updateUser
);

export default router;
