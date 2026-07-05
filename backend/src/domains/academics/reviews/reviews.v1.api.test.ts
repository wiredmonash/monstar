import mongoose from 'mongoose';
import request from 'supertest';

import { accessTokenCookie, getCsrf } from '@shared/testing/helpers';

/**
 * Characterization tests for the LIVE v1 send-report endpoint — the only v1
 * review endpoint the frontend still calls (everything else moved to
 * /api/v2/reviews). Exercises the full middleware stack: global CSRF +
 * verifyToken auth.
 */
describe('POST /api/v1/reviews/send-report', () => {
  it('returns 401 when CSRF passes but there is no access token', async () => {
    const { token, cookies } = await getCsrf(global.app);

    const res = await request(global.app)
      .post('/api/v1/reviews/send-report')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token)
      .send({});

    expect(res.status).toBe(401);
  });

  it('sends a report email (201) with nodemailer stubbed', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .post('/api/v1/reviews/send-report')
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token)
      .send({
        reportReason: 'Spam',
        reportDescription: 'Not relevant',
        reporterName: 'Tester',
        review: {
          _id: new mongoose.Types.ObjectId().toString(),
          title: 'Some review',
          description: 'desc',
          author: {
            _id: new mongoose.Types.ObjectId().toString(),
            username: 'author',
          },
        },
      });

    expect(res.status).toBe(201);
  });
});
