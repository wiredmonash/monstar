import request from 'supertest';

/**
 * Characterization tests for the LIVE v1 units endpoints the frontend still
 * calls via api.service.ts (unit-by-code and required-by). The list/popular/
 * filter endpoints were removed in favour of /api/v2/units; the admin write-ops
 * on this router are intentionally not covered. Note /unit/:code does not
 * lowercase the code.
 */
describe('GET /api/v1/units/unit/:unitcode', () => {
  it('returns a unit by exact (lowercase) code', async () => {
    const res = await request(global.app).get('/api/v1/units/unit/acb2420');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('unitCode', 'acb2420');
  });

  it('returns 404 for an unknown code', async () => {
    const res = await request(global.app).get('/api/v1/units/unit/zzz9999');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/units/:unitCode/required-by', () => {
  it('returns an array of units requiring the given unit', async () => {
    const res = await request(global.app).get(
      '/api/v1/units/acb2420/required-by'
    );

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 404 for an unknown unit code', async () => {
    const res = await request(global.app).get(
      '/api/v1/units/zzz9999/required-by'
    );

    expect(res.status).toBe(404);
  });
});
