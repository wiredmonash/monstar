import type { Request, Response } from 'express';

import { getErrorMessage } from '@shared/utilities/getErrorMessage';

import UnitV1Service from './unit.v1.service';

/**
 * HTTP contract for the legacy v1 units endpoints. Each handler keeps its own
 * explicit try/catch (no asyncHandler + error middleware) so the exact status
 * codes, JSON shapes and error strings from v1 are preserved.
 */
class UnitV1Controller {
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
}

export default UnitV1Controller;
