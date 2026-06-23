import asyncHandler from '@utilities/asyncHandler';

import TokenProvider from '@providers/token.provider';
import UserService from '@services/user.service';

class UserController {
  /**
   * Get current user
   */
  static me = asyncHandler(async (req, res) => {
    const user = req.user;
    if (!user)
      return res.status(404).json({ message: 'User context not found' });
    return res.status(200).json(user);
  });

  /**
   * Get user by username
   */
  static getByUsername = asyncHandler(async (req, res) => {
    const { username } = req.params;
    const user = await UserService.getByUsername(username);
    return res.status(200).json(user);
  });

  /**
   * Login/sign up with google oauth
   */
  static authenticateWithGoogle = asyncHandler(async (req, res) => {
    const { idToken } = req.body;

    const { accessToken, refreshToken, user } =
      await UserService.googleAuthenticate(idToken);

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
  });

  /**
   * Refreshes tokens
   */
  static refresh = asyncHandler(async (req, res) => {
    const { refresh_token } = req.cookies;
    if (!refresh_token) {
      return res.status(401).json({ error: 'No refresh token provided' });
    }

    const { newAccessToken, newRefreshToken } =
      await UserService.refreshUserToken(refresh_token);

    res
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
  });

  /**
   * Logs out a user
   */
  static logout = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }
    await UserService.invalidateRefreshToken(req.user.id);

    res.clearCookie('access_token', { httpOnly: true, sameSite: 'strict' });
    res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'strict' });

    return res.status(200).json({ message: 'Logged out successfully' });
  });

  /**
   * Validates user session
   */
  static validate = asyncHandler(async (req, res) => {
    const accessToken = req.cookies.access_token;
    if (!accessToken)
      return res.status(401).json({ message: 'Not authenticated' });

    const user = await UserService.validate(accessToken);

    return res.status(200).json({ message: 'Authenticated', data: user });
  });

  /**
   * Uploads user avatar to cloudinary
   */
  static uploadAvatar = asyncHandler(async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'You are not authenticated' });
    }
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const avatarUrl = req.file.path;
    const user = await UserService.uploadAvatar(userId, avatarUrl);

    return res.status(200).json({
      message: 'Avatar uploaded successfully',
      data: { profileImg: user.profileImg },
    });
  });
}

export default UserController;
