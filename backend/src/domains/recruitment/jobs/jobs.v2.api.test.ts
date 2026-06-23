import request from 'supertest';

import { OrgLogo } from '@domains/recruitment/orgLogo';

/**
 * Characterization test for the LIVE v2 jobs endpoint the frontend uses
 * (jobs.api.service.ts -> GET /jobs/logos). This is DB-only (OrgLogo model);
 * the Notion-backed job listing endpoints are not called by the frontend.
 */
describe('GET /api/v2/jobs/logos', () => {
  it('returns the stored organisation logos (200)', async () => {
    await OrgLogo.create({
      organisation: 'WIRED',
      logoUrl: 'https://example.com/wired.png',
    });

    const res = await request(global.app).get('/api/v2/jobs/logos');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // Organisation names are normalised to lowercase by the model.
    expect(res.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          organisation: 'wired',
          logoUrl: 'https://example.com/wired.png',
        }),
      ])
    );
  });
});
