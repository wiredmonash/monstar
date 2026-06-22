import { OAuth2Client } from 'google-auth-library';
import jwt, { JwtPayload } from 'jsonwebtoken';

import { cloudinary } from '@providers/cloudinary.provider';
import TokenProvider from '@providers/token.provider';
import UserRepository from '@repositories/user.repository';
import {
  Error409Conflict,
  Error403Forbidden,
  Error404NotFound,
} from '@utilities/errors';

const googleClient = new OAuth2Client();

class UserService {
  static STUDENT_EMAIL_REGEX = /^[a-zA-Z]{4}\d{4}@student\.monash\.edu$/;
  static STAFF_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z]+@monash\.edu$/;

  /**
   * Authenticates a new or existing user with Google OAuth
   */
  static googleAuthenticate = async (idToken) => {
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub } = payload; // eslint-disable-line

    const isStudentEmail = this.STUDENT_EMAIL_REGEX.test(email);
    const isStaffEmail = this.STAFF_EMAIL_REGEX.test(email);
    if (!isStudentEmail && !isStaffEmail) {
      throw new Error403Forbidden(
        'Only students with a valid Monash email can log in.'
      );
    }

    let user = await UserRepository.findByEmailOrGoogleId(email, sub);

    if (!user) {
      let authcate;
      if (isStudentEmail) authcate = email.split('@')[0];
      else if (isStaffEmail) authcate = email.split('.')[0];

      user = await UserRepository.create({
        email: email,
        username: authcate,
        profileImg: picture,
        isGoogleUser: true,
        googleID: sub,
        verified: true,
      });
    }

    if (!user.isGoogleUser) {
      throw new Error409Conflict(
        'Account already exists as non-Google account.'
      );
    }

    const accessToken = TokenProvider.generateAccessToken(user._id, user.admin);
    const refreshToken = TokenProvider.generateRefreshToken();
    const hashedRefreshToken = TokenProvider.hashRefreshToken(refreshToken);
    const refreshTokenExpiry = new Date(
      Date.now() + TokenProvider.REFRESH_TOKEN_EXPIRY
    );
    await UserRepository.updateRefreshToken(
      user,
      hashedRefreshToken,
      refreshTokenExpiry
    );

    return { accessToken, refreshToken, user };
  };

  /**
   * Rotate and create new access token and refresh token for a user
   */
  static refreshUserToken = async (refreshToken) => {
    const hashedRefreshToken = TokenProvider.hashRefreshToken(refreshToken);
    const user =
      await UserRepository.findByHashedRefreshToken(hashedRefreshToken);
    if (!user) {
      throw new Error403Forbidden('Invalid or expired refresh token');
    }

    const newAccessToken = TokenProvider.generateAccessToken(
      user._id,
      user.admin
    );
    const newRefreshToken = TokenProvider.generateRefreshToken();
    const newHashedRefreshToken =
      TokenProvider.hashRefreshToken(newRefreshToken);
    const newRefreshTokenExpiry = new Date(
      Date.now() + TokenProvider.REFRESH_TOKEN_EXPIRY
    );
    await UserRepository.updateRefreshToken(
      user._id,
      newHashedRefreshToken,
      newRefreshTokenExpiry
    );

    return { newAccessToken, newRefreshToken };
  };

  /**
   * Invalidates the refresh token to logout a user
   */
  static invalidateRefreshToken = async (userId) => {
    await UserRepository.invalidateRefreshToken(userId);
  };

  /**
   * Validates user using access token
   */
  static validate = async (accessToken) => {
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET
    ) as JwtPayload;
    const user = await UserRepository.findById(decoded.id);
    if (!user) throw new Error404NotFound('User not found');
    return user;
  };

  /**
   * Gets a user by username
   */
  static getByUsername = async (username) => {
    const user = await UserRepository.findByUsername(username);
    if (!user) throw new Error404NotFound('User not found');
    return user;
  };

  /**
   * Uploads user avatar to cloudinary
   */
  static uploadAvatar = async (userId, avatarUrl) => {
    const user = await UserRepository.findById(userId);
    if (!user) throw new Error404NotFound('User not found');

    if (user.profileImg) {
      try {
        const urlParts = user.profileImg.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0];
        const publicId = `user_avatars/${fileName}`;
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Failed to delete old avatar:', error.message);
      }
    }

    const updatedUser = await UserRepository.updateProfileImage(
      userId,
      avatarUrl
    );

    return updatedUser;
  };
}

export = UserService;
