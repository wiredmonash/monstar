// Stub multer so the upload middleware injects a fake "uploaded" file instead
// of streaming to Cloudinary. This keeps the test offline while still
// exercising the real handler + service (find user, persist profileImg).
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req, res, next) => {
      req.file = {
        path: 'https://res.cloudinary.com/demo/image/upload/user_avatars/fake.png',
      };
      next();
    },
  });
  multer.memoryStorage = () => ({});
  multer.diskStorage = () => ({});
  return multer;
});

const request = require('supertest');
const mongoose = require('mongoose');

const { accessTokenCookie, getCsrf } = require('./helpers');

const FAKE_URL =
  'https://res.cloudinary.com/demo/image/upload/user_avatars/fake.png';

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
      .set('Cookie', [...cookies, accessTokenCookie(userId.toString())].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('profileImg', FAKE_URL);
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
