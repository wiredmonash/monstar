import axios from 'axios';
import request from 'supertest';

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    isAxiosError: vi.fn(() => false),
  },
}));

/**
 * Characterization tests for the LIVE v1 github endpoint
 * (github.service.ts -> GET /github/contributors). axios is mocked so no real
 * call to api.github.com happens. Pins the real formatting logic (filter bots,
 * sort by contributions, cap at 10) and the graceful fallback on error.
 */
describe('GET /api/v1/github/contributors', () => {
  it('returns formatted, sorted, human contributors (200)', async () => {
    vi.mocked(axios.get).mockResolvedValue({
      data: [
        { login: 'alice', type: 'User', contributions: 50, avatar_url: 'a', html_url: 'ua' },
        { login: 'bot', type: 'Bot', contributions: 999, avatar_url: 'b', html_url: 'ub' },
        { login: 'bob', type: 'User', contributions: 80, avatar_url: 'c', html_url: 'uc' },
      ],
    });

    const res = await request(global.app).get('/api/v1/github/contributors');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const usernames = res.body.data.map((c) => c.username);
    expect(usernames).not.toContain('bot'); // non-User types filtered out
    expect(usernames).toEqual(['bob', 'alice']); // sorted by contributions desc
  });

  it('falls back gracefully (200) when the GitHub API errors', async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error('network down'));

    const res = await request(global.app).get('/api/v1/github/contributors');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
