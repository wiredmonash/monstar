import { Redis } from '@upstash/redis';

const redis =
  process.env.MONSTAR_SERVERLESS_CACHE_KV_REST_API_URL &&
  process.env.MONSTAR_SERVERLESS_CACHE_KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.MONSTAR_SERVERLESS_CACHE_KV_REST_API_URL,
        token: process.env.MONSTAR_SERVERLESS_CACHE_KV_REST_API_TOKEN,
      })
    : null;

class CacheProvider {
  static CLIENT = redis;
  static POPULAR_UNITS_TTL = 604800; // 1 week
  /** Return this from fetchFn to skip caching the result. */
  static readonly SKIP_CACHE: unique symbol = Symbol('SKIP_CACHE');

  /**
   * Get cached data or fetch from source
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Function to fetch data if cache misses
   * @param {number} ttl - Time to live in seconds (default: 1 hour)
   */
  static async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T | typeof CacheProvider.SKIP_CACHE>,
    ttl = 3600
  ): Promise<T | never[]> {
    const client = this.CLIENT;
    if (!client) {
      if (process.env.NODE_ENV !== 'test')
        console.warn('Redis not configured, fetching directly');
      const result = await fetchFn();
      return result === this.SKIP_CACHE ? [] : result;
    }

    try {
      const cached = await client.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      const data = await fetchFn();

      if (data === this.SKIP_CACHE) return [];

      await client.setex(key, ttl, JSON.stringify(data));

      return data;
    } catch (err) {
      console.error('Redis error:', err);
      const result = await fetchFn();
      return result === this.SKIP_CACHE ? [] : result;
    }
  }

  /**
   * Invalidate cache by key or pattern
   */
  static async invalidate(keyOrPattern: string) {
    if (!redis) return;

    try {
      if (keyOrPattern.includes('*')) {
        const keys = await redis.keys(keyOrPattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } else {
        await redis.del(keyOrPattern);
      }
    } catch (err) {
      console.error('Cache invalidation error', err);
    }
  }
}

export = CacheProvider;
