import Unit from '@models/unit';

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
    unitcode,
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
   * Find unit by id
   */
  static async findById(unitId) {
    return await Unit.findById(unitId);
  }

  /**
   * Query for units with pagination, filtering, and sorting
   */
  static async findWithPagination(query, sortCriteria, skip, limit) {
    const pipeline = [
      { $match: query },
      {
        $addFields: {
          reviewCount: { $size: '$reviews' },
          hasReviews: { $cond: [{ $gt: [{ $size: '$reviews' }, 0] }, 1, 0] },
        },
      },
    ];

    const countPipeline = [...pipeline, { $count: 'total' }];

    const paginatedPipeline = [
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
  static async findMostReviewedUnits(n) {
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
  static async findRequiredBy(unitCode) {
    return await Unit.find({
      'requisites.prerequisites': {
        $elemMatch: {
          units: { $in: [unitCode.toUpperCase(), unitCode.toLowerCase()] },
        },
      },
    });
  }

  /* ------------------------------ Modification ------------------------------ */

  /**
   * Update a unit by unitcode or unitId
   */
  static async updateOneByUnitcode(identifier, updateData) {
    identifier = identifier.toString();
    const isUnitCode = this.UNIT_CODE_PATTERN.test(identifier);
    const query = isUnitCode ? { unitCode: identifier } : { _id: identifier };
    return await Unit.findOneAndUpdate(query, updateData, {
      new: true,
      runValidators: true,
    });
  }
}

export = UnitRepository;
