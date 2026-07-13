import express from 'express';

import SetuController from './setu.controller';

const router = express.Router();

router.get(
  '/unit/:unitCode',
  // #swagger.tags = ['SETU']
  // #swagger.summary = 'Get all SETU data for a specific unit code'
  SetuController.getByUnitCode
);

export default router;
