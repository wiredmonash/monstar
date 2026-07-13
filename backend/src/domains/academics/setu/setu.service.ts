import type { Id } from '@shared/types';

import SetuRepository from './setu.repository';

/**
 * Orchestration for the SETU subdomain. Shared by the v1 and v2 controllers;
 * this is the canonical service (no version prefix).
 */
class SetuService {
  /**
   * Fetch paginated SETU data plus the total document count
   */
  static fetchPaginated = async (
    offset: unknown,
    limit: unknown,
    sort: string
  ) => {
    const data = await SetuRepository.findPaginated(sort, offset, limit);
    const total = await SetuRepository.countAll();
    return { data, total };
  };

  /**
   * Fetch all SETU data for a unit code
   */
  static fetchByUnitCode = async (unitCode: string) => {
    return await SetuRepository.findByUnitCode(unitCode);
  };

  /**
   * Fetch average SETU scores for a unit code
   */
  static fetchAverageScores = async (unitCode: string) => {
    return await SetuRepository.getAverageScores(unitCode);
  };

  /**
   * Fetch all SETU data for a season
   */
  static fetchBySeason = async (season: string) => {
    return await SetuRepository.findBySeason(season);
  };

  /**
   * Create a SETU entry, lowercasing its unit_code.
   *
   * Returns `null` when an entry with the same (unit_code, Season, code)
   * already exists.
   */
  static createEntry = async (body: Record<string, any>) => {
    const { unit_code, Season, code } = body;

    const existingSetu = await SetuRepository.findDuplicate(
      unit_code.toLowerCase(),
      Season,
      code
    );
    if (existingSetu) return null;

    return await SetuRepository.create({
      ...body,
      unit_code: unit_code.toLowerCase(),
    });
  };

  /**
   * Bulk-upsert an array of SETU entries
   */
  static bulkUpsert = async (entries: any[]) => {
    return await SetuRepository.bulkUpsert(entries);
  };

  /**
   * Update a SETU entry by ID via $set
   */
  static updateById = async (id: Id, body: Record<string, any>) => {
    return await SetuRepository.updateById(id, { $set: body });
  };

  /**
   * Delete a SETU entry by ID
   */
  static deleteById = async (id: Id) => {
    return await SetuRepository.deleteById(id);
  };
}

export default SetuService;
