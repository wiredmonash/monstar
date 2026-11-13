import request from 'supertest';
import mongoose from 'mongoose';

import { User } from '@domains/identity/users';
import {
  accessTokenCookie,
  expectPublicUserFields,
  getCsrf,
  seedReactionGraph,
  seedUserWithReview,
} from '@shared/testing/helpers';

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

describe('GET /api/v2/reviews/popular', () => {
  it('populates each author with public profile fields only', async () => {
    const res = await request(global.app).get('/api/v2/reviews/popular');

    expect(res.status).toBe(200);
    const authors = res.body
      .map((review: { author?: unknown }) => review.author)
      .filter(Boolean);
    expect(authors.length).toBeGreaterThan(0);
    for (const author of authors) expectPublicUserFields(author);
  });
});

/**
 * Send a mutating request as `userId`, with the CSRF token the app requires.
 */
const sendAs = async (
  userId: string,
  method: 'patch' | 'post' | 'put',
  url: string,
  body: object
) => {
  const { token, cookies } = await getCsrf(global.app);
  return request(global.app)
    [method](url)
    .set('Cookie', [...cookies, accessTokenCookie(userId)].join('; '))
    .set('x-csrf-token', token)
    .send(body);
};

describe('PATCH /api/v2/reviews/toggle-reaction/:reviewId', () => {
  it('reacts as the logged-in user, whatever userId the body names', async () => {
    const { authorId, reactorId, reviewId } = await seedReactionGraph();

    const res = await sendAs(
      reactorId,
      'patch',
      `/api/v2/reviews/toggle-reaction/${reviewId}`,
      { userId: authorId, reactionType: 'like' }
    );

    expect(res.status).toBe(200);
    expect(res.body.reactions).toEqual({ liked: true, disliked: false });
    const reactor = await User.findById(reactorId);
    expect(reactor!.likedReviews.map(String)).toEqual([reviewId]);
    const author = await User.findById(authorId);
    expect(author!.likedReviews).toHaveLength(0);

    // The author's like notification is written in the background
    await vi.waitFor(async () => {
      const notified = await User.findById(authorId);
      expect(notified!.notifications).toHaveLength(1);
    });
  });
});
