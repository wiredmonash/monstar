import type { Request, Response } from 'express';

import { getErrorMessage } from '@shared/utilities/getErrorMessage';

import UnitV1Service from './unit.v1.service';
import { isValidSortOption } from './unit.sortOptions';

/**
 * HTTP contract for the legacy v1 units endpoints. Each handler keeps its own
 * explicit try/catch (no asyncHandler + error middleware) so the exact status
 * codes, JSON shapes and error strings from v1 are preserved.
 */
class UnitV1Controller {
  /**
   * GET / — list all units
   */
  static getAll = async (req: Request, res: Response) => {
    try {
      const units = await UnitV1Service.fetchAll();
      return res.status(200).json(units);
    } catch (error) {
      return res.status(500).json({
        error: `An error occured while getting all Units: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * GET /popular — 10 most popular units
   */
  static getPopular = async (req: Request, res: Response) => {
    try {
      const populatedUnits = await UnitV1Service.fetchPopular();
      return res.status(200).json(populatedUnits);
    } catch (err) {
      // NOTE: preserves v1 behavior — logs, responds with the `message` key and
      // does not `return` the response.
      console.error('Error occured while fetching popular units:', err);
      res
        .status(500)
        .json({ message: 'An error occured while fetching popular units.' });
    }
  };

  /**
   * GET /unit/:unitcode — a unit by exact code
   */
  static getByUnitcode = async (req: Request, res: Response) => {
    try {
      // NOTE: preserves v1 behavior — exact match, does NOT lowercase the param.
      const unit = await UnitV1Service.fetchByExactCode(req.params.unitcode);

      if (!unit) return res.status(404).json({ error: 'Unit not found' });

      return res.status(200).json(unit);
    } catch (error) {
      return res.status(500).json({
        error: `An error occured whilst getting the singular unit: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * GET /filter — advanced filtering with pagination
   */
  static getFiltered = async (req: Request, res: Response) => {
    try {
      const { sort = 'Alphabetic' } = req.query;

      if (!isValidSortOption(sort as string)) {
        return res.status(400).json({
          error: `Invalid sort option: ${sort}. Must be one of: Alphabetic, Most Reviews, Highest Overall, Lowest Overall`,
        });
      }

      const { units, total } = await UnitV1Service.fetchFiltered(req.query);

      // NOTE: preserves v1 behavior — 404 when the requested page is empty.
      if (!units.length) {
        return res
          .status(404)
          .json({ error: 'No units match the given query' });
      }

      return res.status(200).json({ units, total });
    } catch (error) {
      return res
        .status(500)
        .json({ error: `Error fetching units: ${getErrorMessage(error)}` });
    }
  };

  /**
   * POST /create — create a single unit
   */
  static create = async (req: Request, res: Response) => {
    try {
      const unit = await UnitV1Service.createUnit(req.body);

      if (!unit) {
        return res.status(400).json({ error: 'Unit already exists' });
      }

      return res.status(201).json(unit);
    } catch (error) {
      return res.status(500).json({
        error: `An error occured while created the Unit: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * POST /create-bulk — create multiple units
   */
  static createBulk = async (req: Request, res: Response) => {
    try {
      const results = await UnitV1Service.bulkCreate(req.body);

      return res
        .status(201)
        .json({ message: 'Bulk creation completed', results });
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred whilst creating the units: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * DELETE /delete/:unitcode — delete a unit
   */
  static remove = async (req: Request, res: Response) => {
    try {
      const unit = await UnitV1Service.deleteByExactCode(req.params.unitcode);

      if (!unit) return res.status(404).json({ error: 'Unit not found' });

      return res.status(200).json({ message: 'Unit successfully deleted' });
    } catch (error) {
      return res.status(500).json({
        error: `Error occured while deleting unit: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * PUT /update/:unitcode — update a unit
   */
  static update = async (req: Request, res: Response) => {
    try {
      const unit = await UnitV1Service.updateByExactCode(
        req.params.unitcode,
        req.body
      );

      if (!unit) return res.status(404).json({ error: 'Unit not found!' });

      return res
        .status(200)
        .json({ msg: `Successfully updated ${req.params.unitcode}` });
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred while updating the unit: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * GET /:unitCode/required-by — units requiring the given unit
   */
  static getRequiredBy = async (req: Request, res: Response) => {
    try {
      const requiredByUnits = await UnitV1Service.fetchRequiredBy(
        req.params.unitCode
      );

      if (requiredByUnits === null) {
        return res.status(404).json({ error: 'Unit not found' });
      }

      return res.status(200).json(requiredByUnits);
    } catch (error) {
      return res.status(500).json({
        error: `Error finding units requiring ${req.params.unitCode}: ${getErrorMessage(error)}`,
      });
    }
  };
}

export default UnitV1Controller;
