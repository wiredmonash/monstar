import mongoose from 'mongoose';
import request from 'supertest';

import {
  accessTokenCookie,
  getCsrf,
  seedUserWithReview,
  seedReactionGraph,
} from './helpers';

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

describe('PUT /api/v1/reviews/update/:reviewId', () => {
  it('updates a review owned by the requester (200)', async () => {
    const { userId, reviewId } = await seedUserWithReview();
    const { token, cookies } = await getCsrf(global.app);

    const res = await request(global.app)
      .put(`/api/v1/reviews/update/${reviewId}`)
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token)
      .send({ title: 'Updated title' });

    expect(res.status).toBe(200);
    expect(res.body.review).toHaveProperty('title', 'Updated title');
  });

  it('returns 404 for an unknown review id', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .put(`/api/v1/reviews/update/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token)
      .send({ title: 'x' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/reviews/delete/:reviewId', () => {
  it('deletes a review owned by the requester (200)', async () => {
    const { userId, reviewId } = await seedUserWithReview();
    const { token, cookies } = await getCsrf(global.app);

    const res = await request(global.app)
      .delete(`/api/v1/reviews/delete/${reviewId}`)
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(200);
  });

  it('returns 404 for an unknown review id', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .delete(`/api/v1/reviews/delete/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/reviews/toggle-reaction/:reviewId', () => {
  it('rejects an invalid reaction type with 400', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .patch(`/api/v1/reviews/toggle-reaction/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token)
      .send({ userId, reactionType: 'bogus' });

    expect(res.status).toBe(400);
  });

  it('returns 404 when the review does not exist', async () => {
    const { token, cookies } = await getCsrf(global.app);
    const userId = new mongoose.Types.ObjectId().toString();

    const res = await request(global.app)
      .patch(`/api/v1/reviews/toggle-reaction/${new mongoose.Types.ObjectId()}`)
      .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
      .set('x-csrf-token', token)
      .send({ userId, reactionType: 'like' });

    expect(res.status).toBe(404);
  });

  it('adds a like: increments the count and reports liked=true (200)', async () => {
    const { reactorId, reviewId } = await seedReactionGraph();
    const { token, cookies } = await getCsrf(global.app);

    const res = await request(global.app)
      .patch(`/api/v1/reviews/toggle-reaction/${reviewId}`)
      .set('Cookie', [...cookies, accessTokenCookie(reactorId)].join('; '))
      .set('x-csrf-token', token)
      .send({ userId: reactorId, reactionType: 'like' });

    expect(res.status).toBe(200);
    expect(res.body.review).toHaveProperty('likes', 1);
    expect(res.body.reactions).toEqual({ liked: true, disliked: false });
  });

  it('toggles a like off when reacting twice (200, count back to 0)', async () => {
    const { reactorId, reviewId } = await seedReactionGraph();

    const like = async () => {
      const { token, cookies } = await getCsrf(global.app);
      return request(global.app)
        .patch(`/api/v1/reviews/toggle-reaction/${reviewId}`)
        .set('Cookie', [...cookies, accessTokenCookie(reactorId)].join('; '))
        .set('x-csrf-token', token)
        .send({ userId: reactorId, reactionType: 'like' });
    };

    await like(); // first like -> likes = 1
    const res = await like(); // second like -> toggled off

    expect(res.status).toBe(200);
    expect(res.body.review).toHaveProperty('likes', 0);
    expect(res.body.reactions).toEqual({ liked: false, disliked: false });
  });
});

describe('POST /api/v1/reviews/send-report', () => {
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
