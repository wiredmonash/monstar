import express from 'express';

import { verifyAdmin } from '@domains/identity/users';

import UnitV1Controller from './unit.v1.controller';

// Router instance
const router = express.Router();

// GET /, /popular and /filter were removed once the frontend moved to their
// /api/v2/units equivalents. The remaining endpoints are either still called
// by the frontend (unit-by-code, required-by) or admin data-management ops
// with no v2 replacement yet.
router.get(
  '/unit/:unitcode',
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Get a unit by unit code'
  UnitV1Controller.getByUnitcode
);

router.post(
  '/create',
  verifyAdmin,
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Create a new unit and add it to the database'
  UnitV1Controller.create
);

router.post(
  '/create-bulk',
  verifyAdmin,
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Create multiple units based on input JSON data'
  UnitV1Controller.createBulk
);

router.delete(
  '/delete/:unitcode',
  verifyAdmin,
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Delete a unit from the database'
  UnitV1Controller.remove
);

router.put(
  '/update/:unitcode',
  verifyAdmin,
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Update unit description and/or name'
  UnitV1Controller.update
);

router.get(
  '/:unitCode/required-by',
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Get all units that have the specified unit as a prerequisite'
  UnitV1Controller.getRequiredBy
);

// Export the router
export default router;
