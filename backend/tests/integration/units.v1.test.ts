import request from 'supertest';

/**
 * Characterization tests for the LIVE v1 units endpoints (the GETs the
 * frontend still calls via api.service.ts). The unused admin write-ops on this
 * router are intentionally not covered. Pins current behaviour for the
 * TypeScript conversion. Note v1 GET / returns 200 (v2 returns 201) and
 * /unit/:code does not lowercase the code.
 */
describe('GET /api/v1/units', () => {
  it('returns all units with status 200', async () => {
    const res = await request(global.app).get('/api/v1/units');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(11);
  });
});

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

describe('GET /api/v1/units/filter', () => {
  it('returns a paginated { units, total } payload', async () => {
    const res = await request(global.app).get('/api/v1/units/filter');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('units');
    expect(res.body).toHaveProperty('total', 11);
    expect(res.body.units.length).toBeLessThanOrEqual(10);
  });

  it('rejects an invalid sort option with 400', async () => {
    const res = await request(global.app).get(
      '/api/v1/units/filter?sort=Bogus'
    );

    expect(res.status).toBe(400);
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
