import type { PipelineStage, UpdateQuery } from 'mongoose';

import type { Id } from '@shared/types';

import Unit from './unit.model';
import type { IUnit } from './unit.types';

class UnitRepository {
  static UNIT_CODE_PATTERN = /^[a-zA-Z]{3}\d{4}$/;

  /* -------------------------------- Retrieval ------------------------------- */

  /**
   * Find all units
   */
  static async findAll() {
    return await Unit.find({}).populate('reviews');
  }

  /**
   * Find unit by unitcode
   */
  static async findOneByUnitcode(
    unitcode: string,
    populateReviews = false,
    populateReviewsAuthor = false
  ) {
    const query = Unit.findOne({ unitCode: unitcode.toLowerCase() });
    return populateReviews
      ? await query.populate({
          path: 'reviews',
          populate: populateReviewsAuthor ? { path: 'author' } : undefined,
        })
      : await query;
  }

  /**
   * Find unit by exact unitcode (no lowercasing)
   *
   * NOTE: preserves v1 behavior — v1 GET /unit/:unitcode matches the code
   * exactly and does not lowercase it (unlike findOneByUnitcode).
   */
  static async findOneByExactUnitcode(unitcode: string) {
    return await Unit.findOne({ unitCode: unitcode });
  }

  /**
   * Find unit by id
   */
  static async findById(unitId: Id) {
    return await Unit.findById(unitId);
  }

  /**
   * Query for units with pagination, filtering, and sorting
   */
  static async findWithPagination(
    query: Record<string, unknown>,
    sortCriteria: Record<string, 1 | -1>,
    skip: number,
    limit: number
  ) {
    const pipeline: PipelineStage[] = [
      { $match: query },
      {
        $addFields: {
          reviewCount: { $size: '$reviews' },
          hasReviews: { $cond: [{ $gt: [{ $size: '$reviews' }, 0] }, 1, 0] },
        },
      },
    ];

    const countPipeline: PipelineStage[] = [...pipeline, { $count: 'total' }];

    const paginatedPipeline: PipelineStage[] = [
      ...pipeline,
      { $sort: { ...sortCriteria, _id: 1 } },
      { $skip: Number(skip) },
      { $limit: Number(limit) },
    ];

    const [units, countResult] = await Promise.all([
      Unit.aggregate(paginatedPipeline),
      Unit.aggregate(countPipeline),
    ]);

    const total = countResult.length > 0 ? countResult[0].total : 0;

    return { units, total };
  }

  /**
   * Query for N most reviewed units
   */
  static async findMostReviewedUnits(n: number) {
    return await Unit.aggregate([
      { $addFields: { reviewCount: { $size: '$reviews' } } },
      { $sort: { reviewCount: -1 } },
      { $limit: n },
    ]).then((units) =>
      Unit.populate(units, {
        path: 'reviews',
        select:
          'title description overallRating relevancyRating facultyRating contentRating likes dislikes',
      })
    );
  }

  /**
   * Finds units that have the given unit as a prerequisite
   *
   * E.g., (given) FIT1045 -> FIT1008 (find these ones)
   */
  static async findRequiredBy(unitCode: string) {
    return await Unit.find({
      'requisites.prerequisites': {
        $elemMatch: {
          units: { $in: [unitCode.toUpperCase(), unitCode.toLowerCase()] },
        },
      },
    });
  }

  /* -------------------------------- Creation -------------------------------- */

  /**
   * Create and save a new unit
   */
  static async create(unitData: Partial<IUnit>) {
    const unit = new Unit(unitData);
    return await unit.save();
  }

  /* ------------------------------ Modification ------------------------------ */

  /**
   * Update a unit by unitcode or unitId
   */
  static async updateOneByUnitcode(
    identifier: Id,
    updateData: UpdateQuery<IUnit>
  ) {
    identifier = identifier.toString();
    const isUnitCode = this.UNIT_CODE_PATTERN.test(identifier);
    const query = isUnitCode ? { unitCode: identifier } : { _id: identifier };
    return await Unit.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /**
   * Update a unit matched by its exact unitcode.
   *
   * NOTE: preserves v1 behavior — v1 PUT /update/:unitcode matches the code
   * exactly (no lowercasing).
   */
  static async updateOneByExactUnitcode(
    unitcode: string,
    updateData: UpdateQuery<IUnit>
  ) {
    return await Unit.updateOne({ unitCode: unitcode }, updateData);
  }

  /* --------------------------------- Removal -------------------------------- */

  /**
   * Delete a unit matched by its exact unitcode.
   *
   * NOTE: preserves v1 behavior — v1 DELETE /delete/:unitcode matches the code
   * exactly and does not lowercase it.
   */
  static async deleteOneByExactUnitcode(unitcode: string) {
    return await Unit.findOneAndDelete({ unitCode: unitcode });
  }
}

export default UnitRepository;
