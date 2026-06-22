const jwt = require('jsonwebtoken');
const request = require('supertest');

/**
 * Build an `access_token` cookie value for a user, matching the payload shape
 * produced by TokenProvider.generateAccessToken ({ id, isAdmin }).
 */
const accessTokenCookie = (userId, isAdmin = false) =>
  `access_token=${jwt.sign({ id: String(userId), isAdmin }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  })}`;

/**
 * Fetch a CSRF token plus the secret cookie(s) the app expects back on
 * mutating requests. Returns the token and the bare `name=value` cookie pairs.
 */
const getCsrf = async (app) => {
  const res = await request(app).get('/api/v1/csrf-token');
  const cookies = (res.headers['set-cookie'] || []).map((c) => c.split(';')[0]);
  return { token: res.body.csrfToken, cookies };
};

module.exports = { accessTokenCookie, getCsrf };
