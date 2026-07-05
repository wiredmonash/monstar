/**
 * Admin (platform ops) controllers for the dev-only v1 endpoints.
 *
 * This subdomain owns no data of its own, so it intentionally has no model,
 * repository, or service files — it is a thin operational surface that delegates
 * to the cache infrastructure and the academics/units domain. Explicit try/catch
 * per handler reproduces the exact v1 responses.
 */
import type { Request, Response } from 'express';

import { AiOverviewService, UnitRepository } from '@domains/academics/units';
import CacheService from '@infrastructure/cache/cache';
import { getErrorMessage } from '@shared/utilities/getErrorMessage';

class AdminV1Controller {
  /**
   * GET /invalidate-cache — clear all cached entries.
   */
  static async invalidateCache(req: Request, res: Response) {
    try {
      await CacheService.invalidate('*');

      res.status(200).json({ message: 'Successfully invalidated all cache' });
    } catch (err) {
      console.error('Error when invalidating cache:', err);
      res.status(500).json({ message: 'Error when invalidating cache' });
    }
  }

  /**
   * POST /ai-overview/regenerate — rebuild AI overviews for all reviewed units.
   *
   * @param {boolean} force - Regenerate even if stored copy is fresh (default false)
   * @param {number} delayMs - Throttle between requests (default service value)
   */
  static async regenerateAllOverviews(req: Request, res: Response) {
    console.log('[Admin Route] AI overview regenerate endpoint called');
    console.log('[Admin Route] Request body:', req.body);

    try {
      const { force = false, delayMs } = req.body || {};
      console.log(
        '[Admin Route] Parsed params - force:',
        force,
        'delayMs:',
        delayMs
      );
      console.log(
        '[Admin Route] Calling AiOverviewService.generateOverviewsForAllUnits...'
      );

      const result = await AiOverviewService.generateOverviewsForAllUnits({
        force: Boolean(force),
        delayMs: typeof delayMs === 'number' ? delayMs : undefined,
      });

      console.log('[Admin Route] Service returned:', result);

      return res.status(200).json({
        message: 'AI overviews regeneration completed',
        result,
      });
    } catch (error) {
      return res.status(500).json({
        error: `Failed to regenerate AI overviews: ${getErrorMessage(error)}`,
      });
    }
  }

  /**
   * POST /:unitcode/ai-overview/regenerate — rebuild one unit's AI overview.
   */
  static async regenerateUnitOverview(req: Request, res: Response) {
    try {
      const unitCode = req.params.unitcode.toLowerCase();
      const { force = true } = req.body || {};

      // NOTE: preserves v1 behavior — UnitRepository.findOneByUnitcode on an
      // already-lowercased code is exactly Unit.findOne({ unitCode }) (its
      // internal re-lowercase is an idempotent no-op); routed through the units
      // barrel instead of touching the Unit model from the controller.
      const unit = await UnitRepository.findOneByUnitcode(unitCode);
      if (!unit) return res.status(404).json({ error: 'Unit not found' });

      const result = await AiOverviewService.generateOverviewForUnit(unit, {
        force: Boolean(force),
      });

      if (result.status === 'skipped') {
        return res
          .status(200)
          .json({ message: 'No regeneration required', result });
      }
      if (result.status === 'updated') {
        await unit.populate('reviews', '_id');
        return res.status(200).json({
          message: 'AI overview updated',
          overview: unit.aiOverview,
          result,
        });
      }

      return res
        .status(500)
        .json({ error: 'Failed to regenerate AI overview', result });
    } catch (error) {
      return res.status(500).json({
        error: `Failed to regenerate AI overview: ${getErrorMessage(error)}`,
      });
    }
  }
}

export default AdminV1Controller;
