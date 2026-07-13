import type { Request, Response } from 'express';

import { Error403Forbidden, Error404NotFound } from '@shared/errors/errors';
import { getErrorMessage } from '@shared/utilities/getErrorMessage';

import UserV1Service from './user.v1.service';

/**
 * Controllers for the legacy /api/v1/auth routes. Each handler uses an explicit
 * try/catch (NOT asyncHandler + error middleware) to reproduce the v1 responses
 * exactly — including the specific status codes, JSON shapes, message strings
 * and `error` vs `message` key choices.
 */
class AuthV1Controller {
  /**
   * GET / (verifyAdmin)
   */
  static getAllUsers = async (req: Request, res: Response) => {
    try {
      const users = await UserV1Service.getAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({
        error: `An error occured while getting all Users: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * DELETE /delete/:userId (verifyToken)
   */
  static deleteUser = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'You are not authenticated' });
      }

      await UserV1Service.deleteUser(req.user.id, req.params.userId);

      return res.status(200).json({ message: 'User successfully deleted' });
    } catch (error) {
      if (error instanceof Error404NotFound)
        return res.status(404).json({ error: error.message });
      if (error instanceof Error403Forbidden)
        return res.status(403).json({ error: error.message });
      return res.status(500).json({
        error: `Error occured while deleting user: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * PUT /update/:userId (verifyToken)
   */
  static updateUser = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'You are not authenticated' });
      }

      const { username, password } = req.body;

      const targetUser = await UserV1Service.updateUser(
        req.user.id,
        req.params.userId,
        username,
        password
      );

      return res.status(200).json({
        message: 'User details successfully updated',
        username: targetUser.username,
      });
    } catch (error) {
      if (error instanceof Error404NotFound)
        return res.status(404).json({ error: error.message });
      if (error instanceof Error403Forbidden)
        return res.status(403).json({ error: error.message });
      if ((error as { status?: number })?.status === 400)
        return res.status(400).json({ error: getErrorMessage(error) });
      return res.status(500).json({
        error: `Error updating user details: ${getErrorMessage(error)}`,
      });
    }
  };
}

export default AuthV1Controller;
