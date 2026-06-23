const request = require('supertest');

/**
 * Characterization tests for the LIVE v1 setus READ endpoints (setu.service.ts
 * in the frontend). No SETU fixtures are seeded, so these pin the empty-data
 * behaviour and response shapes. The admin write-ops on this router are unused
 * and not covered.
 */
describe('GET /api/v1/setus', () => {
  it('returns a paginated envelope with data/total/page/pageSize', async () => {
    const res = await request(global.app).get('/api/v1/setus');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      data: expect.any(Array),
      total: expect.any(Number),
      page: expect.any(Number),
      pageSize: expect.any(Number),
    });
  });
});

describe('GET /api/v1/setus/unit/:unitCode', () => {
  it('returns 404 when no SETU data exists for the unit', async () => {
    const res = await request(global.app).get('/api/v1/setus/unit/acb2420');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/setus/average/:unitCode', () => {
  it('returns 404 when no SETU data exists for the unit', async () => {
    const res = await request(global.app).get('/api/v1/setus/average/acb2420');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/setus/season/:season', () => {
  it('returns 404 when no SETU data exists for the season', async () => {
    const res = await request(global.app).get('/api/v1/setus/season/2019_S1');

    expect(res.status).toBe(404);
  });
});
