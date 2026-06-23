import { User, UserService } from '@domains/identity/users';
import { Error403Forbidden, Error409Conflict } from '@shared/errors/errors';

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
});
