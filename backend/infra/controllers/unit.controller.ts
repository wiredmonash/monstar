import asyncHandler from '@utilities/asyncHandler';

import UnitService from '@services/unit.service';

import { isValidSortOption } from '../../constants/sortOptions';

class UnitController {
  /**
   * List all units
   */
  static getAll = asyncHandler(async (req, res) => {
    const units = await UnitService.fetchAll();
    return res.status(201).json(units);
  });

  /**
   * List units filtered
   */
  static getPaginated = asyncHandler(async (req, res) => {
    const { sort = 'Alphabetic' } = req.query;
    if (!isValidSortOption(sort as string)) {
      return res.status(400).json({
        error: `Invalid sort options: ${sort}. Must be one of: Alphabetic, Most Reviews, Highest Overall, or Lowest Overall`,
      });
    }

    const { units, total } = await UnitService.fetchPaginated(req.query);
    if (!units.length) {
      return res.status(404).json({ error: 'No units match the given query' });
    }

    return res.status(200).json({ units, total });
  });

  /**
   * List most reviewed units (cached)
   */
  static getMostReviewed = asyncHandler(async (req, res) => {
    const mostReviewedUnits = await UnitService.fetchMostReviewed(10);
    return res.status(200).json(mostReviewedUnits);
  });

  /**
   * Get a unit by unitcode
   */
  static getByUnitcode = asyncHandler(async (req, res) => {
    const unit = await UnitService.fetchByCode(
      req.params.unitCode,
      Boolean(req.query.populateReviews),
      Boolean(req.query.populateReviewsAuthor)
    );
    return res.status(200).json(unit);
  });

  /**
   * Update unit by unitcode
   */
  static updateByUnitcode = asyncHandler(async (req, res) => {
    const updatedUnit = await UnitService.modifyByUnitcode(
      req.params.unitcode,
      req.body
    );
    return res.status(204).json({
      msg: `Sucessfully updated ${req.params.unitcode}`,
      unit: updatedUnit,
    });
  });

  /**
   * Get all units that have the given unit as a prerequisite
   */
  static getRequiredBy = asyncHandler(async (req, res) => {
    const units = await UnitService.fetchUnitsRequiredBy(req.params.unitCode);
    return res.status(200).json(units);
  });
}

export = UnitController;
