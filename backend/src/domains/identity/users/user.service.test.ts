import mongoose from 'mongoose';

import { User, UserService } from '@domains/identity/users';
import {
  Error403Forbidden,
  Error404NotFound,
  Error409Conflict,
} from '@shared/errors/errors';

const { mockVerifyIdToken } = vi.hoisted(() => ({
  mockVerifyIdToken: vi.fn(),
}));

vi.mock('google-auth-library', () => {
  return {
    OAuth2Client: vi.fn().mockImplementation(function () {
      return {
        verifyIdToken: mockVerifyIdToken,
      };
    }),
  };
});

describe(UserService.name, () => {
  beforeEach(() => {
    mockVerifyIdToken.mockClear();
  });

  afterEach(() => vi.clearAllMocks());

  // Authentication

  describe(UserService.googleAuthenticate.name, () => {
    const fakeIdTokenString = 'fake-token-string';

    /**
     * Helper: mocks google response for a specific email
     */
    const setupGoogleMock = (
      email: string,
      name = 'Test User',
      sub = '123456789'
    ) => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email,
          name,
          sub,
          picture: 'http://example.com/pic.jpg',
        }),
      });
    };

    it('should create a new user for a valid monash email', async () => {
      // arrange
      const email = 'jdoe1234@student.monash.edu';
      setupGoogleMock(email);

      // act
      const result = await UserService.googleAuthenticate(fakeIdTokenString);

      // assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(email);
      expect(result.user.username).toBe('jdoe1234');

      const dbUser = (await User.findOne({ email }))!;
      expect(dbUser).toBeTruthy();
      expect(dbUser.isGoogleUser).toBe(true);
    });

    it('should create a new user for a valid monash staff/masters email', async () => {
      // arrange
      const email = 'john.doe@monash.edu';
      setupGoogleMock(email);

      // act
      const result = await UserService.googleAuthenticate(fakeIdTokenString);

      // assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(email);
      expect(result.user.username).toBe('john');

      const dbUser = (await User.findOne({ email }))!;
      expect(dbUser).toBeTruthy();
      expect(dbUser.isGoogleUser).toBe(true);
    });

    it('should throw Error403Forbidden for non-Monash emails', async () => {
      // arrange
      setupGoogleMock('nonmonashuser@gmail.com');

      // act and assert
      await expect(
        UserService.googleAuthenticate(fakeIdTokenString)
      ).rejects.toThrow(Error403Forbidden);
    });

    it('should login an existing Google user and update refresh token', async () => {
      // arrange
      const email = 'jdoe6969@student.monash.edu';
      const googleID = 'google-123';
      const existingUser = await User.create({
        email,
        username: 'jdoe6969',
        googleID,
        isGoogleUser: true,
        verified: true,
        refreshToken: 'old-token',
      });
      setupGoogleMock(email, 'Existing User', googleID);

      // act
      const result = await UserService.googleAuthenticate(fakeIdTokenString);
      const updatedUser = (await User.findById(existingUser._id))!;

      // assert
      expect(result.user._id.toString()).toEqual(existingUser._id.toString());
      expect(updatedUser.refreshToken).not.toBe('old-token');
    });

    it('should match an existing Google user by Google ID when the email differs', async () => {
      // arrange: user's stored email differs from the email Google returns,
      // but the Google sub (googleID) is the same
      const storedEmail = 'jdoe4242@student.monash.edu';
      const newEmail = 'jane.doe@monash.edu';
      const googleID = 'google-shared-sub';
      const existingUser = await User.create({
        email: storedEmail,
        username: 'jdoe4242',
        googleID,
        isGoogleUser: true,
        verified: true,
      });
      setupGoogleMock(newEmail, 'Jane Doe', googleID);

      // act
      const result = await UserService.googleAuthenticate(fakeIdTokenString);

      // assert: matched the existing user rather than creating a new one
      expect(result.user._id.toString()).toEqual(existingUser._id.toString());
      expect(await User.countDocuments({ googleID })).toBe(1);
    });

    it('should throw Error409Conflict if account exists but is not a Google account', async () => {
      const email = 'jdoe6767@student.monash.edu';
      await User.create({
        email,
        username: 'jdoe6767',
        isGoogleUser: false,
        verified: true,
      });

      setupGoogleMock(email);

      await expect(
        UserService.googleAuthenticate(fakeIdTokenString)
      ).rejects.toThrow(Error409Conflict);
    });
  });

  // Account deletion

  describe(UserService.deleteUser.name, () => {
    it('lets a user delete their own account', async () => {
      const user = await User.create({
        email: 'selfdel@student.monash.edu',
        username: 'selfdel',
        verified: true,
      });

      await UserService.deleteUser(user._id.toString(), user._id.toString());

      expect(await User.findById(user._id)).toBeNull();
    });

    it('lets an admin delete another user', async () => {
      const admin = await User.create({
        email: 'admin@monash.edu',
        username: 'admin',
        admin: true,
        verified: true,
      });
      const target = await User.create({
        email: 'target@student.monash.edu',
        username: 'target',
        verified: true,
      });

      await UserService.deleteUser(admin._id.toString(), target._id.toString());

      expect(await User.findById(target._id)).toBeNull();
    });

    it('throws Error403Forbidden when a non-admin deletes another user', async () => {
      const caller = await User.create({
        email: 'caller@student.monash.edu',
        username: 'caller',
        verified: true,
      });
      const target = await User.create({
        email: 'other@student.monash.edu',
        username: 'other',
        verified: true,
      });

      await expect(
        UserService.deleteUser(caller._id.toString(), target._id.toString())
      ).rejects.toThrow(Error403Forbidden);

      expect(await User.findById(target._id)).not.toBeNull();
    });

    it('throws Error404NotFound when the requesting user does not exist', async () => {
      const target = await User.create({
        email: 'stillhere@student.monash.edu',
        username: 'stillhere',
        verified: true,
      });
      const ghostId = new mongoose.Types.ObjectId().toString();

      await expect(
        UserService.deleteUser(ghostId, target._id.toString())
      ).rejects.toThrow(Error404NotFound);
    });

    it('throws Error404NotFound when the target user does not exist', async () => {
      const caller = await User.create({
        email: 'requester@student.monash.edu',
        username: 'requester',
        verified: true,
      });
      const missingId = new mongoose.Types.ObjectId().toString();

      await expect(
        UserService.deleteUser(caller._id.toString(), missingId)
      ).rejects.toThrow(Error404NotFound);
    });
  });
});
