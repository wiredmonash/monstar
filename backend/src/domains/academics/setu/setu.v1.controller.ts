import type { Request, Response } from 'express';

import { getErrorMessage } from '@shared/utilities/getErrorMessage';

import SetuService from './setu.service';

/**
 * HTTP contract for the legacy v1 SETU endpoints. Each handler keeps its own
 * explicit try/catch (no asyncHandler + error middleware) so the exact status
 * codes, JSON shapes and error strings from v1 are preserved.
 */
class SetuV1Controller {
  /**
   * GET / — paginated SETU data
   */
  static getAll = async (req: Request, res: Response) => {
    try {
      const { limit = 50, offset = 0, sort = 'unit_code' } = req.query;

      const { data, total } = await SetuService.fetchPaginated(
        offset,
        limit,
        sort as string
      );

      return res.status(200).json({
        data,
        total,
        page: Math.floor(Number(offset) / Number(limit)) + 1,
        pageSize: Number(limit),
      });
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred while getting SETU data: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * GET /unit/:unitCode — SETU data for a unit
   */
  static getByUnitCode = async (req: Request, res: Response) => {
    try {
      const unitCode = req.params.unitCode.toLowerCase();

      const setuData = await SetuService.fetchByUnitCode(unitCode);

      if (!setuData || setuData.length === 0) {
        return res
          .status(404)
          .json({ error: `No SETU data found for unit ${unitCode}` });
      }

      return res.status(200).json(setuData);
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred while getting SETU data for unit: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * GET /average/:unitCode — average SETU scores for a unit
   */
  static getAverageScores = async (req: Request, res: Response) => {
    try {
      const unitCode = req.params.unitCode.toLowerCase();

      const averageScores = await SetuService.fetchAverageScores(unitCode);

      if (!averageScores || averageScores.length === 0) {
        return res
          .status(404)
          .json({ error: `No SETU data found for unit ${unitCode}` });
      }

      // NOTE: preserves v1 behavior — responds with the first aggregation row.
      return res.status(200).json(averageScores[0]);
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred while calculating average scores: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * GET /season/:season — SETU data for a season
   */
  static getBySeason = async (req: Request, res: Response) => {
    try {
      const season = req.params.season;

      const setuData = await SetuService.fetchBySeason(season);

      if (!setuData || setuData.length === 0) {
        return res
          .status(404)
          .json({ error: `No SETU data found for season ${season}` });
      }

      return res.status(200).json(setuData);
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred while getting SETU data for season: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * POST /create — create a SETU entry
   */
  static create = async (req: Request, res: Response) => {
    try {
      // NOTE: preserves v1 behavior — lowercases unit_code; a missing unit_code
      // throws (caught as a 500).
      const setu = await SetuService.createEntry(req.body);

      if (!setu) {
        return res.status(400).json({
          error: 'SETU entry already exists for this unit, season, and code',
        });
      }

      return res.status(201).json(setu);
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred while creating the SETU entry: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * POST /create-bulk — bulk-upsert SETU entries
   */
  static createBulk = async (req: Request, res: Response) => {
    try {
      const setuEntries = req.body;

      if (!Array.isArray(setuEntries)) {
        return res
          .status(400)
          .json({ error: 'Request body should be an array of SETU entries' });
      }

      const bulkResult = await SetuService.bulkUpsert(setuEntries);

      // NOTE: preserves v1 behavior — created = upsertedCount, skipped = the
      // remainder of the submitted entries.
      const created = bulkResult.upsertedCount;
      const skipped = setuEntries.length - created;

      return res.status(201).json({
        message: 'Bulk SETU creation completed',
        totalProcessed: setuEntries.length,
        created,
        skipped,
      });
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred whilst creating the SETU entries: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * PUT /update/:id — update a SETU entry
   */
  static update = async (req: Request, res: Response) => {
    try {
      const updatedSetu = await SetuService.updateById(req.params.id, req.body);

      if (!updatedSetu) {
        return res.status(404).json({ error: 'SETU entry not found' });
      }

      return res.status(200).json(updatedSetu);
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred while updating the SETU entry: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * DELETE /delete/:id — delete a SETU entry
   */
  static remove = async (req: Request, res: Response) => {
    try {
      const deletedSetu = await SetuService.deleteById(req.params.id);

      if (!deletedSetu) {
        return res.status(404).json({ error: 'SETU entry not found' });
      }

      return res
        .status(200)
        .json({ message: 'SETU entry successfully deleted' });
    } catch (error) {
      return res.status(500).json({
        error: `An error occurred while deleting the SETU entry: ${getErrorMessage(error)}`,
      });
    }
  };
}

export default SetuV1Controller;
