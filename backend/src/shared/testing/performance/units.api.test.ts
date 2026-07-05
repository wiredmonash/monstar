import { runArtillery } from './runArtillery';

// The old v1-vs-v2 comparison retired with the v1 /units/popular endpoint;
// this now load-tests the live v2 endpoint on its own.
describe('v2 /units API under load', () => {
  test('/popular', async () => {
    const report = await runArtillery('v2.units.popular');

    const counters = report.aggregate.counters;
    const p95 = report.aggregate.summaries['http.response_time'].p95;

    console.log(`
      📊 Results:
      Requests:  ${counters['http.requests']}
      200s:      ${counters['http.codes.200']}
      p95:       ${p95}ms
    `);

    // Every request must succeed under load.
    expect(counters['http.codes.200']).toBe(counters['http.requests']);
  }, 120_000);
});
