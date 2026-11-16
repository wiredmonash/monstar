/**
 * Helper functions for unit filtering and query building
 */

/**
 * Builds a MongoDB query object based on filter parameters
 */
function buildFilterQuery({
  search = '',
  faculty,
  semesters,
  campuses,
  showReviewed = 'false',
  showUnreviewed = 'false',
  hideNoOfferings = 'false',
}: Record<string, any> = {}) {
  const query: Record<string, any> = {};

  // Search filter (unit code or name), escaped so input matches as plain text
  if (search) {
    const pattern = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { unitCode: { $regex: pattern, $options: 'i' } },
      { name: { $regex: pattern, $options: 'i' } },
    ];
  }

  // A repeated query key arrives as an array and matches any of its values
  const anyOf = (value: any, map = (v: any) => v) =>
    Array.isArray(value) && value.length > 0
      ? { $in: value.map(map) }
      : map(value);

  // Faculty filter
  if (faculty) query.school = anyOf(faculty, (f) => 'Faculty of ' + f);

  // Semester filter
  if (semesters) {
    query.offerings = { $elemMatch: { period: anyOf(semesters) } };
  }

  // Campus filter
  if (campuses) {
    query.offerings = { $elemMatch: { location: anyOf(campuses) } };
  }

  // Reviewed/Unreviewed filters
  if (showReviewed === 'true') {
    query.reviews = { $exists: true, $not: { $size: 0 } };
  }
  if (showUnreviewed === 'true') {
    query.reviews = { $exists: true, $size: 0 };
  }

  // Hide units with no offerings
  if (hideNoOfferings === 'true') {
    query.offerings = { $not: { $eq: null } };
  }

  return query;
}

export { buildFilterQuery };
