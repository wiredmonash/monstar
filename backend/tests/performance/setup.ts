import MockUpstashRedis from './mocks/redis.mock';

vi.mock('@upstash/redis', async () => {
  const Mock = (await import('./mocks/redis.mock')).default;
  return { Redis: new Mock() };
});

export const TEST_PORT = 5555;

let server;
beforeAll(async () => {
  const app = (await import('../../server')).default;
  await new Promise<void>((resolve) => {
    server = app.listen(TEST_PORT, () => resolve());
  });

  await MockUpstashRedis.flushall();
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));

  await MockUpstashRedis.flushall();
});
