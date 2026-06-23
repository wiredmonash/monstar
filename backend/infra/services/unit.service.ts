import type { UpdateQuery } from 'mongoose';

import { getSortCriteria } from '@constants/sortOptions';
import type { IUnit } from '@models/types';
import CacheProvider from '@providers/cache.provider';
import UnitRepository from '@repositories/unit.repository';
import { Error404NotFound, Error422Unprocessable } from '@utilities/errors';
import { buildFilterQuery } from '@utilities/unitFilterHelpers';

class UnitService {
  /**
   * Get all units
   */
  static fetchAll = async () => {
    return await UnitRepository.findAll();
  };

  /**
   * Get units filtered
   */
  static fetchPaginated = async (filterOptions: Record<string, any>) => {
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
   */
  static fetchByCode = async (
    unitCode: string,
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
   */
  static modifyByUnitcode = async (
    unitCode: string,
    updateData: UpdateQuery<IUnit>
  ) => {
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
   */
  static fetchUnitsRequiredBy = async (unitCode: string) => {
    const unit = await UnitRepository.findOneByUnitcode(unitCode);
    if (!unit) throw new Error404NotFound('Unit not found');
    return await UnitRepository.findRequiredBy(unitCode);
  };
}

export = UnitService;
