import express from 'express';

import { verifyAdmin } from '@domains/identity/users';

import SetuV1Controller from './setu.v1.controller';

const router = express.Router();

router.get(
  '/',
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Get all SETU data with optional pagination'
  SetuV1Controller.getAll
);

router.get(
  '/unit/:unitCode',
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Get all SETU data for a specific unit code'
  SetuV1Controller.getByUnitCode
);

router.get(
  '/average/:unitCode',
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Get the average scores across all SETU evaluations for a unit'
  SetuV1Controller.getAverageScores
);

router.get(
  '/season/:season',
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Get SETU data for a specific academic season (e.g. 2019_S1)'
  SetuV1Controller.getBySeason
);

router.post(
  '/create',
  verifyAdmin,
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Create a new SETU data entry in the database (Admin access required)'
  SetuV1Controller.create
);

router.post(
  '/create-bulk',
  verifyAdmin,
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Create multiple SETU entries from a JSON array (Admin access required)'
  SetuV1Controller.createBulk
);

router.put(
  '/update/:id',
  verifyAdmin,
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Update a SETU entry by ID (Admin access required)'
  SetuV1Controller.update
);

router.delete(
  '/delete/:id',
  verifyAdmin,
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Delete a SETU entry by ID (Admin access required)'
  SetuV1Controller.remove
);

// Export the router
export default router;
