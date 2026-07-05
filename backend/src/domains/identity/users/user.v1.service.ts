import bcrypt from 'bcrypt';

import { CreateError } from '@shared/errors/error';
import { Error403Forbidden, Error404NotFound } from '@shared/errors/errors';

import UserRepository from './user.repository';

/**
 * v1-only orchestration for the legacy /api/v1/auth flows. Kept separate from
 * UserService so the whole v1 surface can be deleted in one move. Reuses shared
 * UserService/UserRepository methods only where the semantics match v1 exactly;
 * everything else is ported literally.
 */
class UserV1Service {
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
}

export default UserV1Service;
