import type { Request, Response } from 'express';

import {
  Error403Forbidden,
  Error404NotFound,
  Error409Conflict,
} from '@shared/errors/errors';
import { getErrorMessage } from '@shared/utilities/getErrorMessage';

import TokenProvider from './token.service';
import UserService from './user.service';
import UserV1Service from './user.v1.service';

/**
 * Controllers for the legacy /api/v1/auth routes. Each handler uses an explicit
 * try/catch (NOT asyncHandler + error middleware) to reproduce the v1 responses
 * exactly — including the specific status codes, JSON shapes, message strings
 * and `error` vs `message` key choices.
 */
class AuthV1Controller {
  /**
   * POST /google/authenticate
   */
  static authenticateWithGoogle = async (req: Request, res: Response) => {
    const { idToken } = req.body;
    try {
      const { accessToken, refreshToken, user } =
        await UserV1Service.googleAuthenticate(idToken);

      return res
        .cookie('access_token', accessToken, {
          httpOnly: true,
          sameSite: 'strict',
          maxAge: TokenProvider.ACCESS_TOKEN_EXPIRY,
        })
        .cookie('refresh_token', refreshToken, {
          httpOnly: true,
          sameSite: 'strict',
          maxAge: TokenProvider.REFRESH_TOKEN_EXPIRY,
        })
        .status(200)
        .json({ message: 'Login successful', data: user });
    } catch (error) {
      // NOTE: preserves v1 behavior — 403 uses the `error` key, 409 uses the
      // `message` key.
      if (error instanceof Error403Forbidden)
        return res.status(403).json({ error: error.message });
      if (error instanceof Error409Conflict)
        return res.status(409).json({ message: error.message });
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  };

  /**
   * POST /refresh
   */
  static refresh = async (req: Request, res: Response) => {
    const { refresh_token } = req.cookies;
    if (!refresh_token) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    try {
      const { newAccessToken, newRefreshToken } =
        await UserService.refreshUserToken(refresh_token);

      return res
        .cookie('access_token', newAccessToken, {
          httpOnly: true,
          sameSite: 'strict',
          maxAge: TokenProvider.ACCESS_TOKEN_EXPIRY,
        })
        .cookie('refresh_token', newRefreshToken, {
          httpOnly: true,
          sameSite: 'strict',
          maxAge: TokenProvider.REFRESH_TOKEN_EXPIRY,
        })
        .status(200)
        .json({ message: 'Token refreshed successfully' });
    } catch (error) {
      if (error instanceof Error403Forbidden)
        return res.status(403).json({ error: error.message });
      return res.status(500).json({ error: getErrorMessage(error) });
    }
  };

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
   * POST /logout (verifyToken)
   */
  static logout = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'You are not authenticated' });
      }

      await UserService.invalidateRefreshToken(req.user.id);

      res.clearCookie('access_token', { httpOnly: true, sameSite: 'strict' });
      res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict' });

      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred during logout: ${getErrorMessage(error)}`,
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

  /**
   * GET /validate (no middleware)
   */
  static validate = async (req: Request, res: Response) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({ message: 'Not authenticated' });

    try {
      const user = await UserV1Service.validate(token);
      return res.status(200).json({ message: 'Authenticated', data: user });
    } catch (error) {
      // NOTE: preserves v1 behavior — a missing user is a 404, while jwt/other
      // errors are logged and reported as a 403. Both use the `message` key.
      if (error instanceof Error404NotFound)
        return res.status(404).json({ message: 'User not found' });
      console.error('Invalid token:', error);
      return res.status(403).json({ message: 'Invalid token' });
    }
  };

  /**
   * POST /upload-avatar (verifyToken + multer)
   */
  static uploadAvatar = async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      const user = await UserV1Service.uploadAvatar(email, req.file);

      return res.status(200).json({
        message: 'Avatar uploaded successfully',
        profileImg: user.profileImg,
      });
    } catch (error) {
      if (error instanceof Error404NotFound)
        return res.status(404).json({ error: error.message });
      if ((error as { status?: number })?.status === 400)
        return res.status(400).json({ error: getErrorMessage(error) });
      return res.status(500).json({
        error: `Error uploading avatar: ${getErrorMessage(error)}`,
      });
    }
  };
}

export default AuthV1Controller;
