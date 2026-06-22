const request = require('supertest');
const mongoose = require('mongoose');

const { accessTokenCookie, getCsrf, seedUserWithReview } = require('./helpers');

/**
 * Characterization tests for the LIVE v2 review-delete endpoint
 * (delete-review.service.ts -> DELETE /reviews/delete/:id). Guarded by
 * userMiddleware + global CSRF.
 */
describe('DELETE /api/v2/reviews/delete/:reviewId', () => {
  it('returns 401 without authentication', async () => {
    const { token, cookies } = await getCsrf(global.app);

    const res = await request(global.app)
      .delete(`/api/v2/reviews/delete/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(401);
  });

  it("deletes the requester's own review (200); deleting again 404s", async () => {
    const { userId, reviewId } = await seedUserWithReview();

    const del = async () => {
      const { token, cookies } = await getCsrf(global.app);
      return request(global.app)
        .delete(`/api/v2/reviews/delete/${reviewId}`)
        .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
        .set('x-csrf-token', token);
    };

    const first = await del();
    expect(first.status).toBe(200);

    // The review is really gone, so a second delete now 404s.
    const second = await del();
    expect(second.status).toBe(404);
  });
});
