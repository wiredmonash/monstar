import express from 'express';

import { verifyAdmin } from '@domains/identity/users';

import UnitV1Controller from './unit.v1.controller';

// Router instance
const router = express.Router();

// The read endpoints (GET /, /popular, /filter, /unit/:unitcode and
// /:unitCode/required-by) were removed once the frontend moved to their
// /api/v2/units equivalents. Only the admin data-management ops remain, and
// they have no v2 replacement yet.
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

// Export the router
export default router;
