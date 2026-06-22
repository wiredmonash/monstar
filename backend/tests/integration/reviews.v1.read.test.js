const request = require('supertest');

/**
 * Characterization tests for the LIVE v1 reviews READ endpoints
 * (getAllReviewsGET / getUserReviewsGET in the frontend). The mutating
 * endpoints (create/update/delete/toggle-reaction/send-report) are covered
 * separately once the auth + CSRF helpers are in place.
 */
describe('GET /api/v1/reviews', () => {
  it('returns an array of all reviews', async () => {
    const res = await request(global.app).get('/api/v1/reviews');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/v1/reviews/:unit', () => {
  it('returns reviews for an existing unit', async () => {
    const res = await request(global.app).get('/api/v1/reviews/acb2420');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 404 for an unknown unit code', async () => {
    const res = await request(global.app).get('/api/v1/reviews/zzz9999');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/reviews/user/:userId', () => {
  it('returns an array of reviews for a (valid) user id', async () => {
    const res = await request(global.app).get(
      '/api/v1/reviews/user/000000000000000000000000'
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
