import request from 'supertest';
import mongoose from 'mongoose';

import { accessTokenCookie } from '@shared/testing/helpers';

/**
 * Characterization tests for the v2 units API.
 *
 * These pin the CURRENT observable behaviour (status codes + response shapes)
 * so it stays constant through the TypeScript conversion. They intentionally
 * assert what the code does today, quirks included.
 */
describe('GET /api/v2/units (list all, admin only)', () => {
  it('returns all units for an admin (200)', async () => {
    const adminId = new mongoose.Types.ObjectId().toString();
    const res = await request(global.app)
      .get('/api/v2/units')
      .set('Cookie', accessTokenCookie(adminId, true));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(11);
    expect(res.body[0]).toHaveProperty('unitCode');
  });

  it('returns 403 for a non-admin user', async () => {
    const userId = new mongoose.Types.ObjectId().toString();
    const res = await request(global.app)
      .get('/api/v2/units')
      .set('Cookie', accessTokenCookie(userId, false));

    expect(res.status).toBe(403);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(global.app).get('/api/v2/units');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v2/units/popular', () => {
  it('returns up to 10 most-reviewed units', async () => {
    const res = await request(global.app).get('/api/v2/units/popular');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeLessThanOrEqual(10);
  });
});

describe('GET /api/v2/units/filter', () => {
  it('returns a paginated { units, total } payload by default', async () => {
    const res = await request(global.app).get('/api/v2/units/filter');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('units');
    expect(res.body).toHaveProperty('total');
    expect(Array.isArray(res.body.units)).toBe(true);
    expect(res.body.units.length).toBeLessThanOrEqual(10);
    expect(res.body.total).toBe(11);
  });

  it('rejects an invalid sort option with 400', async () => {
    const res = await request(global.app).get(
      '/api/v2/units/filter?sort=Bogus'
    );

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

describe('GET /api/v2/units/:unitCode', () => {
  it('returns a single unit by code', async () => {
    const res = await request(global.app).get('/api/v2/units/acb2420');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('unitCode', 'acb2420');
  });

  it('returns 404 for an unknown unit code', async () => {
    const res = await request(global.app).get('/api/v2/units/zzz9999');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v2/units/:unitCode/required-by', () => {
  it('returns an array of units requiring the given unit', async () => {
    const res = await request(global.app).get(
      '/api/v2/units/acb2420/required-by'
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 404 for an unknown unit code', async () => {
    const res = await request(global.app).get(
      '/api/v2/units/zzz9999/required-by'
    );

    expect(res.status).toBe(404);
  });
});
