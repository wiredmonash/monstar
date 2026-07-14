// Stub multer so the upload middleware injects a fake "uploaded" file instead
// of streaming to Cloudinary. This keeps the test offline while still
// exercising the real handler + service (find user, persist profileImg).
import mongoose from 'mongoose';
import request from 'supertest';

import { TokenProvider } from '@domains/identity/users';

import { accessTokenCookie, getCsrf } from '@shared/testing/helpers';

vi.mock('multer', () => {
  const multer = () => ({
    single:
      () => (req: { file?: unknown }, _res: unknown, next: () => void) => {
        req.file = {
          path: 'https://res.cloudinary.com/demo/image/upload/user_avatars/fake.png',
        };
        next();
      },
  });
  multer.memoryStorage = () => ({});
  multer.diskStorage = () => ({});
  return { default: multer };
});

const FAKE_AVATAR_URL =
  'https://res.cloudinary.com/demo/image/upload/user_avatars/fake.png';

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
    const setCookie = (
      (res.headers['set-cookie'] as unknown as string[]) || []
    ).join(';');
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

  it('returns 403 for an invalid/expired refresh token', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v2/users/refresh')
      .set('Cookie', [...cookies, 'refresh_token=not-a-real-token'].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(403);
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

describe('POST /api/v2/users/upload-avatar', () => {
  it('saves the uploaded avatar URL as the profile image (200)', async () => {
    const userId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertOne({
      _id: userId,
      username: 'avataruser',
      email: 'av@example.com',
      admin: false,
    });

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v2/users/upload-avatar')
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(userId.toString())].join('; ')
      )
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('profileImg', FAKE_AVATAR_URL);
  });

  it('returns 401 without authentication', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .post('/api/v2/users/upload-avatar')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v2/users (list all, admin only)', () => {
  it('returns all users for an admin (200)', async () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    await mongoose.connection.collection('users').insertOne({
      _id: new mongoose.Types.ObjectId(),
      username: 'someone',
      email: 's@example.com',
      admin: false,
    });

    const res = await request(global.app)
      .get('/api/v2/users')
      .set('Cookie', accessTokenCookie(adminId, true));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('returns 403 for a non-admin user', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const res = await request(global.app)
      .get('/api/v2/users')
      .set('Cookie', accessTokenCookie(userId, false));

    expect(res.status).toBe(403);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(global.app).get('/api/v2/users');

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/v2/users/update/:userId (username, self or admin)', () => {
  it('updates the caller own username (200)', async () => {
    const userId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertOne({
      _id: userId,
      username: 'oldname',
      email: 'u@example.com',
      admin: false,
    });

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .put(`/api/v2/users/update/${userId}`)
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(userId.toString())].join('; ')
      )
      .set('x-csrf-token', token)
      .send({ username: 'newname' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'newname');

    const stored = await mongoose.connection
      .collection('users')
      .findOne({ _id: userId });
    expect(stored?.username).toBe('newname');
  });

  it('returns 400 when no username is provided', async () => {
    const userId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertOne({
      _id: userId,
      username: 'stayput',
      email: 'u2@example.com',
      admin: false,
    });

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .put(`/api/v2/users/update/${userId}`)
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(userId.toString())].join('; ')
      )
      .set('x-csrf-token', token)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 403 when a non-admin updates another user (403)', async () => {
    const callerId = new mongoose.Types.ObjectId();
    const targetId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertMany([
      {
        _id: callerId,
        username: 'caller',
        email: 'c@example.com',
        admin: false,
      },
      {
        _id: targetId,
        username: 'target',
        email: 't@example.com',
        admin: false,
      },
    ]);

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .put(`/api/v2/users/update/${targetId}`)
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(callerId.toString())].join('; ')
      )
      .set('x-csrf-token', token)
      .send({ username: 'hijacked' });

    expect(res.status).toBe(403);
  });

  it('returns 401 without authentication', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .put(`/api/v2/users/update/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token)
      .send({ username: 'x' });

    expect(res.status).toBe(401);
  });

  it('returns 409 when the username is already taken', async () => {
    const callerId = new mongoose.Types.ObjectId();
    const otherId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertMany([
      { _id: callerId, username: 'mine', email: 'm@example.com', admin: false },
      { _id: otherId, username: 'taken', email: 'o@example.com', admin: false },
    ]);

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .put(`/api/v2/users/update/${callerId}`)
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(callerId.toString())].join('; ')
      )
      .set('x-csrf-token', token)
      .send({ username: 'taken' });

    expect(res.status).toBe(409);

    const stored = await mongoose.connection
      .collection('users')
      .findOne({ _id: callerId });
    expect(stored?.username).toBe('mine');
  });

  it('returns 400 when the username exceeds the length limit', async () => {
    const userId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertOne({
      _id: userId,
      username: 'shortname',
      email: 'len@example.com',
      admin: false,
    });

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .put(`/api/v2/users/update/${userId}`)
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(userId.toString())].join('; ')
      )
      .set('x-csrf-token', token)
      .send({ username: 'a'.repeat(21) });

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v2/users/delete/:userId (self or admin)', () => {
  it('lets a user delete their own account (200)', async () => {
    const userId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertOne({
      _id: userId,
      username: 'goodbye',
      email: 'g@example.com',
      admin: false,
    });

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .delete(`/api/v2/users/delete/${userId}`)
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(userId.toString())].join('; ')
      )
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'User successfully deleted');

    const stored = await mongoose.connection
      .collection('users')
      .findOne({ _id: userId });
    expect(stored).toBeNull();
  });

  it('returns 403 when a non-admin deletes another user (403)', async () => {
    const callerId = new mongoose.Types.ObjectId();
    const targetId = new mongoose.Types.ObjectId();
    await mongoose.connection.collection('users').insertMany([
      {
        _id: callerId,
        username: 'delcaller',
        email: 'dc@example.com',
        admin: false,
      },
      {
        _id: targetId,
        username: 'deltarget',
        email: 'dt@example.com',
        admin: false,
      },
    ]);

    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .delete(`/api/v2/users/delete/${targetId}`)
      .set(
        'Cookie',
        [...cookies, accessTokenCookie(callerId.toString())].join('; ')
      )
      .set('x-csrf-token', token);

    expect(res.status).toBe(403);
  });

  it('returns 401 without authentication', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const res = await request(global.app)
      .delete(`/api/v2/users/delete/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(401);
  });
});
