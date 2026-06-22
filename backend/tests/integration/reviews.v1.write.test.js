const request = require('supertest');
const mongoose = require('mongoose');

const { accessTokenCookie, getCsrf } = require('./helpers');

/**
 * Characterization tests for the LIVE v1 review-create endpoint, exercising the
 * full middleware stack: global CSRF + verifyToken auth. These pin the gate
 * behaviour (which must survive the TypeScript conversion) and the happy path.
 */
const validBody = (author) => ({
  review_author: author,
  review_title: 'Great unit',
  review_semester: 'S1',
  review_grade: 'HD',
  review_year: 2024,
  review_overall_rating: 5,
  review_relevancy_rating: 4,
  review_faculty_rating: 5,
  review_content_rating: 4,
  review_description: 'Solid content and supportive faculty.',
});

describe('POST /api/v1/reviews/:unit/create', () => {
  it('is blocked by CSRF (403) when no token is supplied', async () => {
    const author = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .post('/api/v1/reviews/acb2420/create')
      .set('Cookie', accessTokenCookie(author))
      .send(validBody(author));

    expect(res.status).toBe(403);
  });

  it('returns 401 when CSRF passes but there is no access token', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const author = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .post('/api/v1/reviews/acb2420/create')
      .set('Cookie', cookies.join('; '))
      .set('x-csrf-token', token)
      .send(validBody(author));

    expect(res.status).toBe(401);
  });

  it('creates a review (201) with valid auth, CSRF and body', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const author = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .post('/api/v1/reviews/acb2420/create')
      .set('Cookie', [...cookies, accessTokenCookie(author)].join('; '))
      .set('x-csrf-token', token)
      .send(validBody(author));

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('author', author);
  });
});
