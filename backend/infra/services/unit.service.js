const { getSortCriteria } = require('@constants/sortOptions');
const CacheProvider = require('@providers/cache.provider');
const UnitRepository = require('@repositories/unit.repository');
const {
  Error404NotFound,
  Error422Unprocessable,
} = require('@utilities/errors');
const { buildFilterQuery } = require('@utilities/unitFilterHelpers');

/**
 * @typedef {import('@models/unit').IUnit} IUnit
 */

class UnitService {
  /**
   * Get all units
   *
   * @returns {Promise<Array<IUnit>>}
   */
  static fetchAll = async () => {
    return await UnitRepository.findAll();
  };

  /**
   * Get units filtered
   *
   * @param {Object} filterOptions
   * @returns {Promise<{units: Array<IUnit>, total: number}>}
   */
  static fetchPaginated = async (filterOptions) => {
    const { offset = 0, limit = 10, sort = 'Alphabetic' } = filterOptions;

    const query = buildFilterQuery(filterOptions);
    const sortCriteria = getSortCriteria(sort);

    return await UnitRepository.findWithPagination(
      query,
      sortCriteria,
      offset,
      limit
    );
  };

  /**
   * Get N most reviewed units
   *
   * @param {Number} n
   * @returns {Promise<Array<IUnit>>}
   */
  static fetchMostReviewed = async (n = 10) => {
    return await CacheProvider.getOrSet(
      'units:popular',
      async () => {
        return await UnitRepository.findMostReviewedUnits(n);
      },
      CacheProvider.POPULAR_UNITS_TTL
    );
  };

  /**
   * Get a unit by unitcode
   *
   * @param {String} unitCode
   * @returns {Promise<IUnit>}
   */
  static fetchByCode = async (
    unitCode,
    populateReviews = false,
    populateReviewsAuthor = false
  ) => {
    const unit = await UnitRepository.findOneByUnitcode(
      unitCode,
      populateReviews,
      populateReviewsAuthor
    );
    if (!unit) throw new Error404NotFound('Unit not found');
    return unit;
  };

  /**
   * Modify a unit
   *
   * @param {String} unitCode
   * @param {Object} updateData
   * @returns {Promise<IUnit>}
   */
  static modifyByUnitcode = async (unitCode, updateData) => {
    const allowedFields = [
      'name',
      'description',
      'avgOverallRating',
      'avgContentRating',
      'avgFacultyRating',
      'avgRelevancyRating',
    ];
    const hasOnlyAllowedFields = Object.keys(updateData).every((key) =>
      allowedFields.includes(key)
    );
    if (!hasOnlyAllowedFields)
      throw new Error422Unprocessable(
        'Disallowed fields present in update data'
      );
    const unit = await UnitRepository.updateOneByUnitcode(unitCode, updateData);
    if (!unit) throw new Error404NotFound('Unit not found');
    return unit;
  };

  /**
   * Fetch all units that have the given unit as a prerequisite
   *
   * @param {String} unitCode
   * @returns {Promise<Array<IUnit>>}
   */
  static fetchUnitsRequiredBy = async (unitCode) => {
    const unit = await UnitRepository.findOneByUnitcode(unitCode);
    if (!unit) throw new Error404NotFound('Unit not found');
    return await UnitRepository.findRequiredBy(unitCode);
  };
}

module.exports = UnitService;
