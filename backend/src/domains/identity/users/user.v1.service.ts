import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

import { cloudinary } from '@infrastructure/storage/cloudinary';
import { CreateError } from '@shared/errors/error';
import {
  Error403Forbidden,
  Error404NotFound,
  Error409Conflict,
} from '@shared/errors/errors';

import TokenProvider from './token.service';
import UserRepository from './user.repository';

// NOTE: preserves v1 behavior — the v1 router constructed its own OAuth2Client
// (separate from UserService's), so this keeps an equivalent instance.
const client = new OAuth2Client();

/**
 * v1-only orchestration for the legacy /api/v1/auth flows. Kept separate from
 * UserService so the whole v1 surface can be deleted in one move. Reuses shared
 * UserService/UserRepository/TokenProvider methods only where the semantics
 * match v1 exactly; everything else is ported literally.
 */
class UserV1Service {
  static STUDENT_EMAIL_REGEX = /^[a-zA-Z]{4}\d{4}@student\.monash\.edu$/;
  static STAFF_EMAIL_REGEX = /^[a-zA-Z]+\.[a-zA-Z]+@monash\.edu$/;

  /**
   * Login and/or register a user with Google OAuth
   */
  static googleAuthenticate = async (idToken: string) => {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      throw new Error403Forbidden(
        'Access denied: Only students with a valid Monash email can log in.'
      );
    }
    // sub is the unique Google ID assigned to the user
    const { email, name, picture, sub } = payload; // eslint-disable-line

    const isStudentEmail = this.STUDENT_EMAIL_REGEX.test(email);
    const isStaffEmail = this.STAFF_EMAIL_REGEX.test(email);
    if (!isStudentEmail && !isStaffEmail) {
      throw new Error403Forbidden(
        'Access denied: Only students with a valid Monash email can log in.'
      );
    }

    let user = await UserRepository.findByEmailOrGoogleID(email, sub);

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

    // If a user exists with this email but signed up the traditional way.
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
    const updatedUser = await UserRepository.updateRefreshToken(
      user._id,
      hashedRefreshToken,
      refreshTokenExpiry
    );

    return { accessToken, refreshToken, user: updatedUser ?? user };
  };

  /**
   * Get all users
   */
  static getAllUsers = async () => {
    return await UserRepository.findAll();
  };

  /**
   * Delete a user (only the user themselves or an admin may delete)
   */
  static deleteUser = async (
    requestingUserId: string,
    targetUserId: string
  ) => {
    const requestingUser = await UserRepository.findById(requestingUserId);
    if (!requestingUser)
      throw new Error404NotFound('Requesting user not found');

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) throw new Error404NotFound('Target user not found');

    const isSameUser =
      requestingUser._id.toString() === targetUser._id.toString();
    const isAdminDeletingOther = requestingUser.admin && !isSameUser;
    if (!isSameUser && !isAdminDeletingOther)
      throw new Error403Forbidden(
        'You are not authorised to delete this account'
      );

    // NOTE: preserves v1 behavior — deletion goes through findOneAndDelete so
    // the user model's deletion-cascade hook fires.
    await UserRepository.deleteById(targetUser._id);
  };

  /**
   * Update a user's username and/or password (only the user themselves or an
   * admin may update)
   */
  static updateUser = async (
    requestingUserId: string,
    targetUserId: string,
    username?: string,
    password?: string
  ) => {
    const requestingUser = await UserRepository.findById(requestingUserId);
    if (!requestingUser)
      throw new Error404NotFound('Requesting user not found');

    const targetUser = await UserRepository.findById(targetUserId);
    if (!targetUser) throw new Error404NotFound('Target user not found');

    const isSameUser =
      requestingUser._id.toString() === targetUser._id.toString();
    const isAdminUpdatingOther = requestingUser.admin && !isSameUser;
    if (!isSameUser && !isAdminUpdatingOther)
      throw new Error403Forbidden(
        'You are not authorised to update user details'
      );

    // NOTE: preserves v1 behavior — validation happens after the auth checks,
    // so an unauthorised caller gets 403 before this 400.
    if (!username && !password)
      throw CreateError(
        400,
        'Either username or password is required to update'
      );

    if (username) targetUser.username = username;
    if (password) targetUser.password = await bcrypt.hash(password, 10);

    // NOTE: preserves v1 behavior — persists via document.save().
    await targetUser.save();

    return targetUser;
  };

  /**
   * Validate a user's session from an access token
   */
  static validate = async (accessToken: string) => {
    const decoded = jwt.verify(
      accessToken,
      process.env.JWT_SECRET as string
    ) as TokenPayload;

    // NOTE: preserves v1 behavior — uses a field projection (unlike
    // UserService.validate, which returns the full document).
    const user = await UserRepository.findByIdWithValidationFields(decoded.id);
    if (!user) throw new Error404NotFound('User not found');

    return user;
  };

  /**
   * Upload an avatar to Cloudinary and assign it as the user's profileImg
   */
  static uploadAvatar = async (email: string, file?: Express.Multer.File) => {
    // NOTE: preserves v1 behavior — looks the user up by email from the request
    // body (not by the authenticated token's user id) and 404s before the file
    // check.
    const user = await UserRepository.findByEmail(email);
    if (!user) throw new Error404NotFound('User not found');

    if (!file) throw CreateError(400, 'No file uploaded');

    // NOTE: preserves v1 behavior — the old-avatar destroy is NOT wrapped in its
    // own try/catch, so a destroy failure surfaces as a 500 (unlike
    // UserService.uploadAvatar, which swallows it).
    if (user.profileImg) {
      const urlParts = user.profileImg.split('/');
      const fileName = urlParts[urlParts.length - 1].split('.')[0];
      const publicId = `user_avatars/${fileName}`;
      await cloudinary.uploader.destroy(publicId);
    }

    user.profileImg = file.path;
    await user.save();

    return user;
  };
}

export default UserV1Service;
