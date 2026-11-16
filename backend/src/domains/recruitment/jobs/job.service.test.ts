import JobService from './job.service';

describe(JobService.name, () => {
  describe(JobService.getDateKey.name, () => {
    it('should give the Melbourne calendar date as YYYY-MM-DD', () => {
      // Melbourne midnight is 13:00 UTC in summer and 14:00 UTC in winter
      expect(JobService.getDateKey('2026-01-01T12:59:59Z')).toEqual(
        '2026-01-01'
      );
      expect(JobService.getDateKey('2026-01-01T13:00:00Z')).toEqual(
        '2026-01-02'
      );
      expect(JobService.getDateKey('2026-06-30T13:59:59Z')).toEqual(
        '2026-06-30'
      );
      expect(JobService.getDateKey('2026-06-30T14:00:00Z')).toEqual(
        '2026-07-01'
      );
    });

    it('should give null for an invalid date', () => {
      expect(JobService.getDateKey('not a date')).toBeNull();
    });
  });
});
