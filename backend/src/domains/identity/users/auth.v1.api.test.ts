import mongoose from 'mongoose';
import request from 'supertest';

import { TokenProvider } from '@domains/identity/users';

import { getCsrf, accessTokenCookie } from '@shared/testing/helpers';

/**
 * Characterization tests for the LIVE v1 auth flows the frontend still calls
 * (auth.service.ts / the auth interceptor -> /auth/refresh, /auth/logout).
 * google/authenticate and /validate moved to /api/v2/users and their v1
 * endpoints were removed.
 */
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
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(userId.toString())].join('; ')
      )
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');

    // The refresh token is really invalidated in the database.
    const after = (await mongoose.connection
      .collection('users')
      .findOne({ _id: userId }))!;
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
