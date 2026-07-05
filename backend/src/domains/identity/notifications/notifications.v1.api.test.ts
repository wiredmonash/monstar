import request from 'supertest';
import mongoose from 'mongoose';

import { accessTokenCookie, getCsrf } from '@shared/testing/helpers';

/**
 * Characterization tests for the LIVE v1 notifications endpoints (used by the
 * notifications popup in the frontend). Both require verifyToken.
 */
describe('GET /api/v1/notifications/user/:userId', () => {
  it('returns the notifications array for the authenticated user (200)', async () => {
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .get(`/api/v1/notifications/user/${userId}`)
      .set('Cookie', accessTokenCookie(userId));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("returns 403 when requesting another user's notifications", async () => {
    const res = await request(global.app)
      .get(`/api/v1/notifications/user/${new mongoose.Types.ObjectId()}`)
      .set(
        'Cookie',
        accessTokenCookie(new mongoose.Types.ObjectId().toString())
      );

    expect(res.status).toBe(403);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(global.app).get(
      `/api/v1/notifications/user/${new mongoose.Types.ObjectId()}`
    );

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/v1/notifications/:notificationId', () => {
  it('returns 404 for an unknown notification (auth + CSRF satisfied)', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .delete(`/api/v1/notifications/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(404);
  });
});
