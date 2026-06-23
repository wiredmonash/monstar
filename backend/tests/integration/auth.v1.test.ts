// Mock the Google OAuth client so no real token verification happens. The
// shared mock fn lets each test control the returned payload.
import mongoose from 'mongoose';
import request from 'supertest';

import TokenProvider from '@providers/token.provider';

import { getCsrf, accessTokenCookie } from './helpers';

const { mockVerifyIdToken } = vi.hoisted(() => ({ mockVerifyIdToken: vi.fn() }));
vi.mock('google-auth-library', () => ({
  OAuth2Client: vi.fn().mockImplementation(function () {
    return { verifyIdToken: mockVerifyIdToken };
  }),
}));

const googlePayload = (overrides = {}) => ({
  email: 'abcd1234@student.monash.edu',
  name: 'Test Student',
  picture: 'https://example.com/pic.png',
  sub: 'google-sub-123',
  ...overrides,
});

/**
 * Characterization tests for the LIVE v1 auth flows the frontend depends on
 * (auth.service.ts -> /auth/google/authenticate, /auth/refresh).
 */
describe('POST /api/v1/auth/google/authenticate', () => {
  it('registers a new Google user and sets auth cookies (200)', async () => {
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googlePayload() });
    const { token, cookies } = await getCsrf(global.app);

    const res = await request(global.app)
      .post('/api/v1/auth/google/authenticate')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token)
      .send({ idToken: 'fake-google-id-token' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Login successful');
    expect(res.body.data).toHaveProperty(
      'email',
      'abcd1234@student.monash.edu'
    );
    expect(res.body.data).toHaveProperty('username', 'abcd1234');

    const setCookie = ((res.headers['set-cookie'] as unknown as string[]) || []).join(';');
    expect(setCookie).toMatch(/access_token=/);
    expect(setCookie).toMatch(/refresh_token=/);
  });

  it('rejects a non-Monash email with 403', async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => googlePayload({ email: 'someone@gmail.com' }),
    });
    const { token, cookies } = await getCsrf(global.app);

    const res = await request(global.app)
      .post('/api/v1/auth/google/authenticate')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token)
      .send({ idToken: 'fake' });

    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotates tokens for a valid refresh token (200)', async () => {
    const plain = 'auth-refresh-token';
    await mongoose.connection.collection('users').insertOne({
      _id: new mongoose.Types.ObjectId(),
      username: 'authrefresher',
      email: 'ar@example.com',
      admin: false,
      isGoogleUser: true,
      refreshToken: TokenProvider.hashRefreshToken(plain),
      refreshTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [...cookies, `refresh_token=${plain}`].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Token refreshed successfully');
  });

  it('returns 401 when no refresh token cookie is present', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(401);
  });

  it('returns 403 for an invalid/expired refresh token', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [...cookies, 'refresh_token=not-a-real-token'].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/auth/validate', () => {
  it('returns the user for a valid access token (200)', async () => {
    const userId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertOne({
      _id: userId,
      username: 'validuser',
      email: 'v@example.com',
      admin: false,
      isGoogleUser: true,
    });

    const res = await request(global.app)
      .get('/api/v1/auth/validate')
      .set('Cookie', accessTokenCookie(userId.toString()));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Authenticated');
    expect(res.body.data).toHaveProperty('username', 'validuser');
  });

  it('returns 401 without an access token', async () => {
    const res = await request(global.app).get('/api/v1/auth/validate');

    expect(res.status).toBe(401);
  });

  it('returns 403 for an invalid access token', async () => {
    const res = await request(global.app)
      .get('/api/v1/auth/validate')
      .set('Cookie', 'access_token=garbage.token.value');

    expect(res.status).toBe(403);
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('clears the session and invalidates the refresh token (200)', async () => {
    const userId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertOne({
      _id: userId,
      username: 'logoutuser',
      email: 'lo@example.com',
      admin: false,
      isGoogleUser: true,
      refreshToken: 'somehash',
      refreshTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [...cookies, accessTokenCookie(userId.toString())].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');

    // The refresh token is really invalidated in the database.
    const after = await mongoose.connection
      .collection('users')
      .findOne({ _id: userId });
    expect(after.refreshToken).toBeUndefined();
  });

  it('returns 401 without authentication', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v1/auth/logout')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(401);
  });
});
