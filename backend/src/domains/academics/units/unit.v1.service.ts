import UnitRepository from './unit.repository';

/**
 * Orchestration for the legacy v1 units endpoints. Kept separate from the v2
 * UnitService so v1 behaviour (exact-match lookups, `||` fallbacks) is
 * preserved literally.
 */
class UnitV1Service {
  /**
   * Get a unit by its exact (non-lowercased) unitcode
   */
  static fetchByExactCode = async (unitcode: string) => {
    return await UnitRepository.findOneByExactUnitcode(unitcode);
  };

  /**
   * Create a single unit from snake_case body fields
   *
   * Returns `null` when a unit with the same code already exists.
   *
   * NOTE: preserves v1 behavior — a missing unit_code throws while lowercasing
   * (caught upstream as a 500).
   */
  static createUnit = async (body: Record<string, any>) => {
    const existingUnit = await UnitRepository.findOneByUnitcode(body.unit_code);
    if (existingUnit) return null;

    return await UnitRepository.create({
      unitCode: body.unit_code.toLowerCase(),
      name: body.unit_name,
      description: body.unit_description,
    });
  };

  /**
   * Create multiple units sequentially, skipping duplicates
   *
   * NOTE: preserves v1 behavior — sequential loop with per-unit skip logic and
   * parseInt on credit_points; result item shapes are kept exactly.
   */
  static bulkCreate = async (unitData: Record<string, any>) => {
    const results = [];

    for (const [unitCode, unitDetails] of Object.entries(unitData)) {
      const existingUnit = await UnitRepository.findOneByUnitcode(unitCode);

      if (existingUnit) {
        results.push({
          unitCode,
          status: 'Skipped',
          message: 'Unit already exists',
        });
        continue;
      }

      await UnitRepository.create({
        unitCode: unitCode.toLowerCase(),
        name: unitDetails.title,
        description: unitDetails.description || '',
        level: unitDetails.level,
        creditPoints: parseInt(unitDetails.credit_points, 10),
        school: unitDetails.school,
        academicOrg: unitDetails.academic_org,
        scaBand: unitDetails.sca_band,
        requisites: unitDetails.requisites,
        offerings: unitDetails.offerings,
      });
      results.push({ unitCode, status: 'Created' });
    }

    return results;
  };

  /**
   * Delete a unit by its exact (non-lowercased) unitcode
   */
  static deleteByExactCode = async (unitcode: string) => {
    return await UnitRepository.deleteOneByExactUnitcode(unitcode);
  };

  /**
   * Update a unit by its exact (non-lowercased) unitcode
   *
   * Returns `null` when the unit does not exist.
   */
  static updateByExactCode = async (
    unitcode: string,
    body: Record<string, any>
  ) => {
    const unit = await UnitRepository.findOneByExactUnitcode(unitcode);
    if (!unit) return null;

    // NOTE: preserves v1 behavior — `||` fallbacks keep the old value for falsy
    // inputs (e.g. 0 does not overwrite).
    await UnitRepository.updateOneByExactUnitcode(unitcode, {
      $set: {
        name: body.unit_name || unit.name,
        description: body.unit_description || unit.description,
        avgOverallRating: body.avgOverallRating || unit.avgOverallRating,
        avgContentRating: body.avgContentRating || unit.avgContentRating,
        avgFacultyRating: body.avgFacultyRating || unit.avgFacultyRating,
        avgRelevancyRating: body.avgRelevancyRating || unit.avgRelevancyRating,
      },
    });

    return unit;
  };

  /**
   * Get all units that have the given unit as a prerequisite
   *
   * Returns `null` when the given unit does not exist.
   *
   * NOTE: preserves v1 behavior — lowercases the param before matching.
   */
  static fetchRequiredBy = async (rawUnitCode: string) => {
    const unitCode = rawUnitCode.toLowerCase();

    const unitExists = await UnitRepository.findOneByExactUnitcode(unitCode);
    if (!unitExists) return null;

    return await UnitRepository.findRequiredBySelectCodeName(unitCode);
  };
}

export default UnitV1Service;
