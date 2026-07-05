import { runArtillery } from './runArtillery';

describe('Comparing v1 and v2 /units APIs', () => {
  test('/popular', async () => {
    const baseline = await runArtillery('v1.units.popular');
    const candidate = await runArtillery('v2.units.popular');

    const p95Baseline = baseline.aggregate.summaries['http.response_time'].p95;
    const p95Candidate =
      candidate.aggregate.summaries['http.response_time'].p95;

    console.log(`
      📊 Results:
      Baseline p95:  ${p95Baseline}ms
      Candidate p95: ${p95Candidate}ms
      ----------------------------
      Difference:    ${p95Candidate - p95Baseline}ms
    `);

    expect(p95Candidate).toBeLessThan(p95Baseline);
  }, 120_000);
});
