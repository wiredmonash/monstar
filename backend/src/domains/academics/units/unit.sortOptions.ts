/**
 * Sort options for unit filtering
 * These constants ensure consistency across the application
 */

const SORT_OPTIONS = {
  ALPHABETIC: 'Alphabetic',
  MOST_REVIEWS: 'Most Reviews',
  HIGHEST_OVERALL: 'Highest Overall',
  LOWEST_OVERALL: 'Lowest Overall',
};

/**
 * Returns MongoDB sort criteria for a given sort option
 */
function getSortCriteria(sortOption: string): Record<string, 1 | -1> {
  switch (sortOption) {
    case SORT_OPTIONS.ALPHABETIC:
      return { unitCode: 1 };
    case SORT_OPTIONS.MOST_REVIEWS:
      return { reviewCount: -1 };
    case SORT_OPTIONS.HIGHEST_OVERALL:
      // Sort by: 1) has reviews (yes first), 2) highest rating first
      return { hasReviews: -1, avgOverallRating: -1 };
    case SORT_OPTIONS.LOWEST_OVERALL:
      // Sort by: 1) has reviews (yes first), 2) lowest rating first
      return { hasReviews: -1, avgOverallRating: 1 };
    default:
      return { unitCode: 1 }; // Default to alphabetic
  }
}

/**
 * Checks if the sort option requires filtering by review count
 */
function requiresReviews(sortOption: string) {
  return (
    sortOption === SORT_OPTIONS.HIGHEST_OVERALL ||
    sortOption === SORT_OPTIONS.LOWEST_OVERALL
  );
}

/**
 * Validates if a sort option is valid
 */
function isValidSortOption(sortOption: string) {
  return Object.values(SORT_OPTIONS).includes(sortOption);
}

export { SORT_OPTIONS, getSortCriteria, requiresReviews, isValidSortOption };
