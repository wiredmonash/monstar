import express from 'express';

import Unit from '@models/unit';
import AiOverviewService from '@providers/aiOverview.provider';
import CacheService from '@providers/cache.provider';
const router = express.Router();

router.get('/invalidate-cache', async (req, res) => {
  // #swagger.tags = ['Developer']
  // #swagger.summary = 'Invalidate the cache'

  try {
    await CacheService.invalidate('*');

    res.status(200).json({ message: 'Successfully invalidated all cache' });
  } catch (err) {
    console.error('Error when invalidating cache:', err);
    res.status(500).json({ message: 'Error when invalidating cache' });
  }
});

/**
 * ! POST Regenerate AI overview for all units
 *
 * @async
 * @param {boolean} force - Regenerate even if stored copy is fresh (default false)
 * @param {number} delayMs - Throttle between requests (default service value)
 */
router.post('/ai-overview/regenerate', async function (req, res) {
  // #swagger.tags = ['Developer']
  // #swagger.summary = 'Admin-only endpoint to rebuild AI overviews across all units with human reviews'

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
    return res
      .status(500)
      .json({ error: `Failed to regenerate AI overviews: ${error.message}` });
  }
});

/**
 * ! POST Regenerate AI overview for a specific unit
 *
 * @async
 */
router.post('/:unitcode/ai-overview/regenerate', async function (req, res) {
  // #swagger.tags = ['Developer']
  // #swagger.summary = 'Admin-only endpoint to rebuild the AI overview for a single unit'

  try {
    const unitCode = req.params.unitcode.toLowerCase();
    const { force = true } = req.body || {};

    const unit = await Unit.findOne({ unitCode });
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
    return res
      .status(500)
      .json({ error: `Failed to regenerate AI overview: ${error.message}` });
  }
});

export = router;
