export const BASE_URL = 'https://monstar.wired.org.au';

export const DEFAULT_PROFILE_IMG =
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSWwfGUCDwrZZK12xVpCOqngxSpn0BDpq6ewQ&s';

/**
 *  ! |========================================================================|
 *  ! | META/SEO CONSTANTS
 *  ! |========================================================================|
 */
// * Basic --------------------------------------------------------------------|
// Title
export const META_BASIC_TITLE =
  'MonSTAR | Student Unit Reviews for Monash University';

// Description
export const META_BASIC_DESCRIPTION =
  'Find and read student reviews of Monash University units. Compare ratings, difficulty levels, and experiences from real students to choose the best units for your degree.';

// Keywords
export const META_BASIC_KEYWORDS =
  'Monash University, unit reviews, course reviews, student ratings, Monash units, unit selection, Monash subjects, subject reviews, MonSTAR';

// Open Graph Description
export const META_BASIC_OPEN_GRAPH_DESCRIPTION =
  'Find honest reviews of Monash University units from fellow students. Filter by faculty, semester, campus, and more.';

// Twitter Title
export const META_BASIC_TWITTER_TITLE = 'Browse Monash Unit Reviews | MonSTAR';

// Sitename
export const META_SITENAME = 'MonSTAR';
// Author
export const META_AUTHOR = 'WIRED Monash';

// * Home ---------------------------------------------------------------------|
// Description
export const META_HOME_DESCRIPTION =
  'MonSTAR is a platform for Monash University students to browse, review, and share feedback on academic units. Find the best units for your degree.';

// Keywords
export const META_HOME_KEYWORDS =
  'Monash University, Monash, student reviews, WAM booster, Monash reviews, Monash units, MonSTAR, WIRED Monash, best Monash units';

// Open Graph Description
export const META_HOME_OPEN_GRAPH_DESCRIPTION =
  'Find honest reviews of Monash University units from fellow students. Discover the best units for your degree path.';

// Twitter Description
export const META_HOME_TWITTER_DESCRIPTION =
  'Find Monash University Units based on Student Reviews and Ratings.';

// * Jobs Board ----------------------------------------------------------------|
// Title
export const META_JOBS_TITLE = 'Monash University Student Roles | MonSTAR';

// Description
export const META_JOBS_DESCRIPTION =
  'Browse roles for student teams, clubs and societies at Monash University.';

// Keywords
export const META_JOBS_KEYWORDS =
  'monash student roles, student opportunities, internships, student experience, monash university, part-time roles monash, MonSTAR roles board';

// Open Graph Description
export const META_JOBS_OPEN_GRAPH_DESCRIPTION =
  'Discover student roles at Monash University - student teams, clubs and societies.';

// Twitter Description
export const META_JOBS_TWITTER_DESCRIPTION =
  'Browse roles at student teams, clubs and societies for Monash University students.';

// * Unit list ----------------------------------------------------------------|
// Title
export const META_UNIT_LIST_TITLE =
  'Browse Monash University Units for Student Reviews';

// * Unit overview ------------------------------------------------------------|
// Title
export const getMetaUnitOverviewTitle = (
  unitCode: string,
  unitName: string
): string => `${unitCode} (${unitName}) Student Reviews at Monash University`;

// Description
export const getMetaUnitOverviewDescription = (
  reviewCount: number,
  unitCode: string,
  unitName: string
): string =>
  `Read ${reviewCount} student reviews for ${unitCode} (${unitName}) at Monash University. See ratings, difficulty level, and student experiences.`;

// Keywords
export const getMetaUnitOverviewKeywords = (
  unitCode: string,
  unitName: string
): string =>
  `${unitCode}, ${unitName}, Monash, Monash Uni, Monash University, unit reviews, student reviews, MonSTAR, ${unitCode} reviews, ${unitCode} difficulty, ${unitCode} ratings, ${unitCode} monstar`;

// Open Graph Title
export const getMetaUnitOverviewOpenGraphTitle = (
  unitCode: string,
  unitName: string
): string => `${unitCode} - ${unitName} | Student Reviews`;
// Open Graph Description
export const getMetaUnitOverviewOpenGraphDescription = (
  unitCode: string,
  averageRating: number,
  reviewCount: number
): string =>
  `See what students think about ${unitCode}. Average rating: ${averageRating}/5 from ${reviewCount} reviews.`;

// Twitter Title
export const getMetaUnitOverviewTwitterTitle = (unitCode: string): string =>
  `${unitCode} Student Reviews at Monash University`;
// Twitter Description
export const getMetaUnitOverviewTwitterDescription = (
  unitCode: string,
  unitName: string,
  averageRating: number
): string =>
  `See what Monash students think about ${unitCode} (${unitName}). Average rating: ${averageRating}/5.`;
