import express from 'express';

import AdminV1Controller from './admin.v1.controller';

const router = express.Router();

router.get(
  '/invalidate-cache',
  // #swagger.tags = ['Developer']
  // #swagger.summary = 'Invalidate the cache'
  AdminV1Controller.invalidateCache
);

router.post(
  '/ai-overview/regenerate',
  // #swagger.tags = ['Developer']
  // #swagger.summary = 'Admin-only endpoint to rebuild AI overviews across all units with human reviews'
  AdminV1Controller.regenerateAllOverviews
);

router.post(
  '/:unitcode/ai-overview/regenerate',
  // #swagger.tags = ['Developer']
  // #swagger.summary = 'Admin-only endpoint to rebuild the AI overview for a single unit'
  AdminV1Controller.regenerateUnitOverview
);

export default router;
