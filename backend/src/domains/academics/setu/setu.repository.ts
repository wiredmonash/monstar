import type { AnyBulkWriteOperation, UpdateQuery } from 'mongoose';

import type { Id } from '@shared/types';

import SETU from './setu.model';
import type { ISETULean } from './setu.types';

/**
 * All Mongoose access for the SETU subdomain lives here. Controllers and the
 * service never touch the model directly.
 */
class SetuRepository {
  /* -------------------------------- Retrieval ------------------------------- */

  /**
   * Find SETU documents with sorting and pagination
   */
  static async findPaginated(sort: string, offset: unknown, limit: unknown) {
    return await SETU.find({})
      .sort(sort)
      .skip(Number(offset))
      .limit(Number(limit));
  }

  /**
   * Count all SETU documents
   */
  static async countAll() {
    return await SETU.countDocuments({});
  }

  /**
   * Find all SETU documents for a unit code (newest season first)
   */
  static async findByUnitCode(unitCode: string) {
    return await SETU.findByUnitCode(unitCode);
  }

  /**
   * Aggregate average scores for a unit code
   */
  static async getAverageScores(unitCode: string) {
    return await SETU.getAverageScores(unitCode);
  }

  /**
   * Find all SETU documents for a season
   */
  static async findBySeason(season: string) {
    return await SETU.find({ Season: season });
  }

  /**
   * Find an existing SETU document by its unique (unit_code, Season, code) key
   */
  static async findDuplicate(unitCode: string, season: string, code: string) {
    return await SETU.findOne({ unit_code: unitCode, Season: season, code });
  }

  /* -------------------------------- Creation -------------------------------- */

  /**
   * Create and save a single SETU document
   */
  static async create(setuData: Partial<ISETULean>) {
    const setu = new SETU(setuData);
    return await setu.save();
  }

  /**
   * Bulk-upsert SETU documents, inserting only entries that do not yet exist.
   *
   * NOTE: preserves v1 behavior — each entry is upserted via $setOnInsert so
   * existing rows are left untouched; unit_code is lowercased in both the
   * filter and the inserted document.
   */
  static async bulkUpsert(entries: any[]) {
    const operations: AnyBulkWriteOperation<ISETULean>[] = entries.map(
      (entry: any) => {
        const unitCode = entry.unit_code.toLowerCase();
        return {
          updateOne: {
            filter: {
              unit_code: unitCode,
              Season: entry.Season,
              code: entry.code,
            },
            update: { $setOnInsert: { ...entry, unit_code: unitCode } },
            upsert: true,
          },
        };
      }
    );

    return await SETU.bulkWrite(operations);
  }

  /* ------------------------------ Modification ------------------------------ */

  /**
   * Update a SETU document by ID, returning the updated document
   */
  static async updateById(id: Id, updateData: UpdateQuery<ISETULean>) {
    return await SETU.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  /* --------------------------------- Removal -------------------------------- */

  /**
   * Delete a SETU document by ID
   */
  static async deleteById(id: Id) {
    return await SETU.findByIdAndDelete(id);
  }
}

export default SetuRepository;
