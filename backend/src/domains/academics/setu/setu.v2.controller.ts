import asyncHandler from '@shared/utilities/asyncHandler';

import SetuService from './setu.service';

/**
 * HTTP contract for the v2 SETU endpoints. Uses asyncHandler so thrown errors
 * flow to the shared error middleware instead of per-handler try/catch.
 */
class SetuV2Controller {
  /**
   * GET /unit/:unitCode — SETU data for a unit (newest season first)
   */
  static getByUnitCode = asyncHandler(async (req, res) => {
    const setuData = await SetuService.fetchByUnitCode(
      req.params.unitCode.toLowerCase()
    );
    return res.status(200).json(setuData);
  });
}

export default SetuV2Controller;
