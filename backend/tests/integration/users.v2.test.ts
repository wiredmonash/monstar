import request from 'supertest';
import mongoose from 'mongoose';

import TokenProvider from '@providers/token.provider';

import { getCsrf, accessTokenCookie } from './helpers';

/**
 * Characterization tests for the LIVE v2 users endpoints the frontend calls
 * (user.service.ts -> GET /users/:username, POST /users/refresh).
 */
describe('GET /api/v2/users/:username', () => {
  it('returns the user when the username exists (200)', async () => {
    const username = 'profileuser';
    await mongoose.connection.collection('users').insertOne({
      _id: new mongoose.Types.ObjectId(),
      username,
      email: 'p@example.com',
      admin: false,
    });

    const res = await request(global.app).get(`/api/v2/users/${username}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', username);
  });

  it('returns 404 for an unknown username', async () => {
    const res = await request(global.app).get('/api/v2/users/nobody');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/v2/users/refresh', () => {
  it('rotates the tokens for a valid refresh token (200, new cookies set)', async () => {
    const plain = 'plain-refresh-token';
    await mongoose.connection.collection('users').insertOne({
      _id: new mongoose.Types.ObjectId(),
      username: 'refresher',
      email: 'r@example.com',
      admin: false,
      refreshToken: TokenProvider.hashRefreshToken(plain),
      refreshTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
    });

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v2/users/refresh')
      .set('Cookie', [...cookies, `refresh_token=${plain}`].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Token refreshed successfully');
    const setCookie = ((res.headers['set-cookie'] as unknown as string[]) || []).join(';');
    expect(setCookie).toMatch(/access_token=/);
    expect(setCookie).toMatch(/refresh_token=/);
  });

  it('returns 401 when no refresh token cookie is present', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v2/users/refresh')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v2/users/me', () => {
  it('returns the authenticated user context (200)', async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .get('/api/v2/users/me')
      .set('Cookie', accessTokenCookie(userId));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', userId);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(global.app).get('/api/v2/users/me');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v2/users/validate', () => {
  it('returns the user for a valid session (200)', async () => {
    const userId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertOne({
      _id: userId,
      username: 'v2validuser',
      email: 'v2v@example.com',
      admin: false,
    });

    const res = await request(global.app)
      .get('/api/v2/users/validate')
      .set('Cookie', accessTokenCookie(userId.toString()));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Authenticated');
    expect(res.body.data).toHaveProperty('username', 'v2validuser');
  });

  it('returns 401 without an access token', async () => {
    const res = await request(global.app).get('/api/v2/users/validate');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/v2/users/logout', () => {
  it('clears the session (200)', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .post('/api/v2/users/logout')
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Logged out successfully');
  });
});
