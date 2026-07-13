import request from 'supertest';
import mongoose from 'mongoose';

/**
 * Integration tests for the SETU unit-read route. The shared setup does not
 * seed SETU data, so each test inserts what it needs into the `setus`
 * collection (cleared after every test).
 */
const seedSetu = (docs: Record<string, unknown>[]) =>
  mongoose.connection.collection('setus').insertMany(docs);

const baseDoc = {
  unit_name: 'Test Unit',
  code: 'Overall',
  Responses: 10,
  Invited: 20,
};

describe('GET /api/v2/setus/unit/:unitCode', () => {
  it('returns a unit’s SETU data newest season first', async () => {
    await seedSetu([
      { ...baseDoc, unit_code: 'fit1008', Season: '2021_S1' },
      { ...baseDoc, unit_code: 'fit1008', Season: '2023_S2' },
      { ...baseDoc, unit_code: 'fit1008', Season: '2022_S1' },
    ]);

    const res = await request(global.app).get('/api/v2/setus/unit/fit1008');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.map((s: { Season: string }) => s.Season)).toEqual([
      '2023_S2',
      '2022_S1',
      '2021_S1',
    ]);
  });

  it('lowercases the unit code before querying', async () => {
    await seedSetu([{ ...baseDoc, unit_code: 'fit1008', Season: '2023_S2' }]);

    const res = await request(global.app).get('/api/v2/setus/unit/FIT1008');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });

  it('returns 200 with an empty array when a unit has no SETU data', async () => {
    const res = await request(global.app).get('/api/v2/setus/unit/zzz9999');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});
