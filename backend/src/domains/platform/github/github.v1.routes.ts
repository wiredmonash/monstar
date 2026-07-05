import express from 'express';

import GithubController from './github.controller';

const router = express.Router();

router.get(
  '/contributors',
  // #swagger.tags = ['GitHub']
  // #swagger.summary = 'Fetch contributors from the MonSTAR GitHub repository (If repository is private or API unavailable, returns fallback contributor data)'
  GithubController.getContributors
);

// Export the router
export default router;
