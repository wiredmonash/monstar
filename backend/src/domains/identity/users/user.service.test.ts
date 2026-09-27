import mongoose from 'mongoose';

import { Review } from '@domains/academics/reviews';
import { Unit } from '@domains/academics/units';
import { Notification } from '@domains/identity/notifications';
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
      const updatedUser = (await User.findById(existingUser._id).select(
        '+refreshToken'
      ))!;

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

    /**
     * Helper: seeds an author with a review in each of two units, a like and
     * a dislike on another user's reviews in those units, and a notification
     */
    const seedAuthorWithActivity = async () => {
      const [author, other] = await User.create([
        { email: 'auth1234@student.monash.edu', username: 'auth1234' },
        { email: 'othr1234@student.monash.edu', username: 'othr1234' },
      ]);
      const [unitA, unitB] = await Unit.create(
        ['tst1001', 'tst1002'].map((unitCode) => ({
          unitCode,
          name: 'Test unit',
          level: 1,
          creditPoints: 6,
          school: 'Test school',
          academicOrg: 'Test org',
          scaBand: '1',
        }))
      );

      const review = (
        unit: typeof unitA,
        by: typeof author,
        rating: number
      ) => ({
        title: 'Test review',
        semester: 'First semester',
        year: 2025,
        overallRating: rating,
        relevancyRating: rating,
        facultyRating: rating,
        contentRating: rating,
        description: 'Test review text',
        unit: unit._id,
        author: by._id,
      });
      const [ownA, ownB, likedA, dislikedB] = await Review.create([
        review(unitA, author, 1),
        review(unitB, author, 1),
        { ...review(unitA, other, 4), likes: 1 },
        { ...review(unitB, other, 3), dislikes: 1 },
      ]);

      await Unit.updateOne(
        { _id: unitA._id },
        { reviews: [ownA._id, likedA._id] }
      );
      await Unit.updateOne(
        { _id: unitB._id },
        { reviews: [ownB._id, dislikedB._id] }
      );
      await User.updateOne(
        { _id: author._id },
        { likedReviews: [likedA._id], dislikedReviews: [dislikedB._id] }
      );
      await Notification.create({
        data: { message: 'othr1234 liked your review on TST1001' },
        navigateTo: '/unit/tst1001',
        review: ownA._id,
        user: author._id,
      });

      return { author, unitA, unitB, likedA, dislikedB };
    };

    it('deletes the reviews, notifications and votes along with the account', async () => {
      const { author, unitA, unitB, likedA, dislikedB } =
        await seedAuthorWithActivity();

      await UserService.deleteUser(
        author._id.toString(),
        author._id.toString()
      );

      expect(await User.findById(author._id)).toBeNull();
      expect(await Review.find({ author: author._id })).toHaveLength(0);
      expect(await Notification.find({ user: author._id })).toHaveLength(0);

      // Each unit keeps only the other user's review, and its averages follow
      const averages = (rating: number) => ({
        avgOverallRating: rating,
        avgRelevancyRating: rating,
        avgFacultyRating: rating,
        avgContentRating: rating,
      });
      const unitAAfter = (await Unit.findById(unitA._id))!;
      const unitBAfter = (await Unit.findById(unitB._id))!;
      expect(unitAAfter.reviews.map(String)).toEqual([likedA._id.toString()]);
      expect(unitAAfter.toObject()).toMatchObject(averages(4));
      expect(unitBAfter.reviews.map(String)).toEqual([
        dislikedB._id.toString(),
      ]);
      expect(unitBAfter.toObject()).toMatchObject(averages(3));

      expect((await Review.findById(likedA._id))!.likes).toBe(0);
      expect((await Review.findById(dislikedB._id))!.dislikes).toBe(0);
    });

    it('keeps the account and its reviews when the cleanup fails', async () => {
      const { author } = await seedAuthorWithActivity();
      // Fail a write that runs after the reviews are already deleted
      vi.spyOn(Notification, 'deleteMany').mockReturnValueOnce({
        session: () => Promise.reject(new Error('simulated write failure')),
      } as never);

      await expect(
        UserService.deleteUser(author._id.toString(), author._id.toString())
      ).rejects.toThrow('simulated write failure');

      expect(await User.findById(author._id)).not.toBeNull();
      expect(await Review.find({ author: author._id })).toHaveLength(2);
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
