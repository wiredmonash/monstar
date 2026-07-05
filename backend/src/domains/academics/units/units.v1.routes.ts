import express from 'express';

import { verifyAdmin } from '@domains/identity/users';

import UnitV1Controller from './unit.v1.controller';

// Router instance
const router = express.Router();

router.get(
  '/',
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Get all units from the database'
  UnitV1Controller.getAll
);

router.get(
  '/popular',
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Get 10 most popular units'
  UnitV1Controller.getPopular
);

router.get(
  '/unit/:unitcode',
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Get a unit by unit code'
  UnitV1Controller.getByUnitcode
);

router.get(
  '/filter',
  // #swagger.tags = ['Units']
  // #swagger.summary = 'Get units with advanced filtering'
  UnitV1Controller.getFiltered
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
