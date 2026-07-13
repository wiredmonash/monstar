import express from 'express';

import SetuV2Controller from './setu.v2.controller';

const router = express.Router();

router.get(
  '/unit/:unitCode',
  // #swagger.tags = ['SETU V2']
  // #swagger.summary = 'Get all SETU data for a specific unit code'
  SetuV2Controller.getByUnitCode
);

export default router;
