import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import request from 'supertest';

import { Unit } from '@domains/academics/units';
import type { Id } from '@shared/types';

/**
 * Build an `access_token` cookie value for a user, matching the payload shape
 * produced by TokenProvider.generateAccessToken ({ id, isAdmin }).
 */
const accessTokenCookie = (userId: Id, isAdmin = false) =>
  `access_token=${jwt.sign(
    { id: String(userId), isAdmin },
    process.env.JWT_SECRET as string,
    {
      expiresIn: '15m',
    }
  )}`;

/**
 * Fetch a CSRF token plus the secret cookie(s) the app expects back on
 * mutating requests. Returns the token and the bare `name=value` cookie pairs.
 */
const getCsrf = async (app: Express) => {
  const res = await request(app).get('/api/v1/csrf-token');
  const cookies = (
    (res.headers['set-cookie'] as unknown as string[]) || []
  ).map((c) => c.split(';')[0]);
  return { token: res.body.csrfToken, cookies };
};

/**
 * Insert a user and a review authored by them (for the unit `acb2420`) using
 * raw collection writes, bypassing schema validation the same way the fixture
 * loader does. Returns the ids needed to drive owner-only endpoints.
 */
const seedUserWithReview = async () => {
  const userId = new mongoose.Types.ObjectId();
  const reviewId = new mongoose.Types.ObjectId();

  const unit = await Unit.findOne({ unitCode: 'acb2420' });

  await mongoose.connection.collection('users').insertOne({
    _id: userId,
    username: 'tester',
    email: `tester+${userId}@example.com`,
    admin: false,
    reviews: [reviewId],
    likedReviews: [],
    dislikedReviews: [],
    notifications: [],
  });

  await mongoose.connection.collection('reviews').insertOne({
    _id: reviewId,
    title: 'Seed review',
    semester: 'S1',
    year: 2024,
    grade: 'D',
    overallRating: 4,
    relevancyRating: 4,
    facultyRating: 4,
    contentRating: 4,
    description: 'seed',
    likes: 0,
    dislikes: 0,
    unit: unit!._id,
    author: userId,
  });

  return { userId: userId.toString(), reviewId: reviewId.toString() };
};

/**
 * Seed the full graph the toggle-reaction handler needs: a review, its author,
 * and a separate reacting user (all with empty reaction/notification arrays so
 * the first reaction is deterministic). The unit is `acb2420` from fixtures.
 */
const seedReactionGraph = async () => {
  const authorId = new mongoose.Types.ObjectId();
  const reactorId = new mongoose.Types.ObjectId();
  const reviewId = new mongoose.Types.ObjectId();

  const unit = await Unit.findOne({ unitCode: 'acb2420' });

  await mongoose.connection.collection('users').insertMany([
    {
      _id: authorId,
      username: 'author',
      email: `author+${authorId}@example.com`,
      admin: false,
      reviews: [reviewId],
      likedReviews: [],
      dislikedReviews: [],
      notifications: [],
    },
    {
      _id: reactorId,
      username: 'reactor',
      profileImg: '',
      email: `reactor+${reactorId}@example.com`,
      admin: false,
      reviews: [],
      likedReviews: [],
      dislikedReviews: [],
      notifications: [],
    },
  ]);

  await mongoose.connection.collection('reviews').insertOne({
    _id: reviewId,
    title: 'Reaction target',
    semester: 'S1',
    year: 2024,
    grade: 'D',
    overallRating: 4,
    relevancyRating: 4,
    facultyRating: 4,
    contentRating: 4,
    description: 'seed',
    likes: 0,
    dislikes: 0,
    unit: unit!._id,
    author: authorId,
  });

  return {
    authorId: authorId.toString(),
    reactorId: reactorId.toString(),
    reviewId: reviewId.toString(),
  };
};

export { accessTokenCookie, getCsrf, seedUserWithReview, seedReactionGraph };
