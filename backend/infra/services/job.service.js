const { JOB_STATUS } = require('@constants/jobOptions');
const CacheProvider = require('@providers/cache.provider');
const NotionProvider = require('@providers/notion.provider');
const JobRepository = require('@repositories/job.repository');
const { Error404NotFound } = require('@utilities/errors');

class JobService {
  static CACHE_PREFIX = 'jobs';
  static CACHE_TTL = 900; // 15 minutes in seconds
  static JOBS_TIME_ZONE = 'Australia/Melbourne';

  static buildCacheKey = (...segments) =>
    `${this.CACHE_PREFIX}:${segments.join(':')}:${this.getDateKey() ?? 'unknown-day'}`;

  static getDateKey = (value = new Date()) => {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.JOBS_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (!year || !month || !day) return null;
    return `${year}-${month}-${day}`;
  };

  static hasCloseDatePassed = (closeDate, now = new Date()) => {
    const closeDateKey = this.getDateKey(closeDate);
    const currentDateKey = this.getDateKey(now);

    if (!closeDateKey || !currentDateKey) return false;
    return currentDateKey > closeDateKey;
  };

  static sanitizeJob = (job, now = new Date()) => {
    if (job?.Status?.toUpperCase() !== JOB_STATUS.OPEN) return job;
    if (!this.hasCloseDatePassed(job['Close Date'], now)) return job;

    return {
      ...job,
      Status: JOB_STATUS.CLOSED,
    };
  };

  static sanitizeJobs = (jobs, now = new Date()) =>
    jobs.map((job) => this.sanitizeJob(job, now));

  static fetchAll = async () => {
    const cacheKey = this.buildCacheKey('all');
    return await CacheProvider.getOrSet(
      cacheKey,
      async () => {
        const jobs = await JobRepository.findAll();
        if (jobs.length === 0) return CacheProvider.SKIP_CACHE;
        return this.sanitizeJobs(jobs);
      },
      this.CACHE_TTL
    );
  };

  static fetchByStatus = async (status) => {
    const cacheKey = this.buildCacheKey('status', status);
    return await CacheProvider.getOrSet(
      cacheKey,
      async () => {
        const jobs = await this.fetchAll();
        return jobs.filter(
          (job) => job.Status?.toUpperCase() === status.toUpperCase()
        );
      },
      this.CACHE_TTL
    );
  };

  static fetchOpen = async () => await this.fetchByStatus(JOB_STATUS.OPEN);

  static fetchByNotionId = async (notionId) => {
    const cacheKey = this.buildCacheKey('notionId', notionId);
    const job = await CacheProvider.getOrSet(
      cacheKey,
      async () => {
        const jobs = await this.fetchAll();
        return (
          jobs.find((candidate) => candidate.notionId === notionId) ?? null
        );
      },
      this.CACHE_TTL
    );
    if (!job) throw new Error404NotFound('Job listing not found');
    return job;
  };

  static fetchByRoleType = async (roleType) => {
    const cacheKey = this.buildCacheKey('roleType', roleType);
    return await CacheProvider.getOrSet(
      cacheKey,
      async () => {
        const jobs = await this.fetchAll();
        const target = roleType.toLowerCase();
        return jobs.filter((job) =>
          (job['Role Type'] || []).some(
            (currentRoleType) => currentRoleType.toLowerCase() === target
          )
        );
      },
      this.CACHE_TTL
    );
  };

  static invalidateCache = async () => {
    await CacheProvider.invalidate(`${this.CACHE_PREFIX}:*`);
    NotionProvider.clearMetaCache();
  };
}

module.exports = JobService;
