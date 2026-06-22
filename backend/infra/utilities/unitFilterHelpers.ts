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
}) {
  const query: Record<string, any> = {};

  // Search filter (unit code or name)
  if (search) {
    query.$or = [
      { unitCode: { $regex: search, $options: 'i' } },
      { name: { $regex: search, $options: 'i' } },
    ];
  }

  // Faculty filter
  if (faculty && Array.isArray(faculty) && faculty.length > 0) {
    query.school = { $in: faculty.map((f) => 'Faculty of ' + f) };
  } else if (faculty) {
    query.school = 'Faculty of ' + faculty;
  }

  // Semester filter
  if (semesters && Array.isArray(semesters) && semesters.length > 0) {
    query.offerings = { $elemMatch: { period: { $in: semesters } } };
  } else if (semesters) {
    query.offerings = { $elemMatch: { period: semesters } };
  }

  // Campus filter
  if (campuses && Array.isArray(campuses) && campuses.length > 0) {
    query.offerings = { $elemMatch: { location: { $in: campuses } } };
  } else if (campuses) {
    query.offerings = { $elemMatch: { location: campuses } };
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
