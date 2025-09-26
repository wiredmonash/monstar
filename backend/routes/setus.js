// Module Imports
const express = require('express');

// Model Imports
const Unit = require('../models/unit');
const SETU = require('../models/setu');

// Function Imports
const { verifyAdmin } = require('../utils/verify_token.js');

// Router instance
const router = express.Router();

/**
 * ! GET Get All SETU Data
 *
 * Gets all SETU data with optional pagination.
 *
 * @async
 * @returns {JSON} Responds with a paginated list of SETU data in JSON format.
 * @throws {500} If an error occurs whilst fetching SETU data from the database.
 */
router.get('/', async function (req, res) {
  try {
    const { limit = 50, offset = 0, sort = 'unit_code' } = req.query;

    // Find and paginate SETU data
    const setuData = await SETU.find({})
      .sort(sort)
      .skip(Number(offset))
      .limit(Number(limit));

    // Get total count for pagination
    const total = await SETU.countDocuments({});

    // Respond 200 with JSON list containing SETU data
    return res.status(200).json({
      data: setuData,
      total,
      page: Math.floor(offset / limit) + 1,
      pageSize: Number(limit),
    });
  } catch (error) {
    // Handle general errors 500
    return res.status(500).json({
      error: `An error occurred while getting SETU data: ${error.message}`,
    });
  }
});

/**
 * ! GET Get SETU Data by Unit Code
 *
 * Gets all SETU data for a specific unit code.
 *
 * @async
 * @returns {JSON} Responds with SETU data for the unit in JSON format.
 * @throws {404} If no SETU data is found for the unit code.
 * @throws {500} If an error occurs whilst fetching SETU data.
 */
router.get('/unit/:unitCode', async function (req, res) {
  try {
    const unitCode = req.params.unitCode.toLowerCase();

    // Use the static method defined in the SETU model
    const setuData = await SETU.findByUnitCode(unitCode);

    // If no data found, return 404
    if (!setuData || setuData.length === 0) {
      return res
        .status(404)
        .json({ error: `No SETU data found for unit ${unitCode}` });
    }

    // Return the SETU data
    return res.status(200).json(setuData);
  } catch (error) {
    return res.status(500).json({
      error: `An error occurred while getting SETU data for unit: ${error.message}`,
    });
  }
});

/**
 * ! GET Get Average SETU Scores for Unit
 *
 * Gets the average scores across all SETU evaluations for a unit.
 *
 * @async
 * @returns {JSON} Responds with average SETU scores in JSON format.
 * @throws {404} If no SETU data is found for the unit code.
 * @throws {500} If an error occurs during processing.
 */
router.get('/average/:unitCode', async function (req, res) {
  try {
    const unitCode = req.params.unitCode.toLowerCase();

    // Use the static method defined in the SETU model to get average scores
    const averageScores = await SETU.getAverageScores(unitCode);

    // If no data found, return 404
    if (!averageScores || averageScores.length === 0) {
      return res
        .status(404)
        .json({ error: `No SETU data found for unit ${unitCode}` });
    }

    // Return the average scores
    return res.status(200).json(averageScores[0]);
  } catch (error) {
    return res.status(500).json({
      error: `An error occurred while calculating average scores: ${error.message}`,
    });
  }
});

/**
 * ! GET Get SETU Data by Season
 *
 * Gets SETU data for a specific academic season (e.g. 2019_S1).
 *
 * @async
 * @returns {JSON} Responds with SETU data for the season in JSON format.
 * @throws {404} If no SETU data is found for the season.
 * @throws {500} If an error occurs whilst fetching SETU data.
 */
router.get('/season/:season', async function (req, res) {
  try {
    const season = req.params.season;

    // Find SETU data for the specified season
    const setuData = await SETU.find({ Season: season });

    // If no data found, return 404
    if (!setuData || setuData.length === 0) {
      return res
        .status(404)
        .json({ error: `No SETU data found for season ${season}` });
    }

    // Return the SETU data
    return res.status(200).json(setuData);
  } catch (error) {
    return res.status(500).json({
      error: `An error occurred while getting SETU data for season: ${error.message}`,
    });
  }
});

/**
 * ! POST Create New SETU Entry
 *
 * Creates a new SETU data entry in the database.
 * Admin access required.
 *
 * @async
 * @returns {JSON} Responds with the created SETU entry in JSON format.
 * @throws {400} If the SETU entry already exists or validation fails.
 * @throws {500} If an error occurs whilst creating the SETU entry.
 */
router.post('/create', verifyAdmin, async function (req, res) {
  try {
    const { unit_code, Season, code } = req.body;

    // Check if SETU entry already exists
    const existingSetu = await SETU.findOne({
      unit_code: unit_code.toLowerCase(),
      Season,
      code,
    });

    if (existingSetu) {
      return res.status(400).json({
        error: 'SETU entry already exists for this unit, season, and code',
      });
    }

    // Prepare the SETU data with lowercase unit_code
    const setuData = {
      ...req.body,
      unit_code: unit_code.toLowerCase(),
    };

    // Create and save the new SETU entry
    const setu = new SETU(setuData);
    await setu.save();

    // Return 201 (created), and show the new SETU entry in JSON format
    return res.status(201).json(setu);
  } catch (error) {
    return res.status(500).json({
      error: `An error occurred while creating the SETU entry: ${error.message}`,
    });
  }
});

/**
 * ! POST Create SETU Entries in Bulk
 *
 * Creates multiple SETU entries from a JSON array.
 * Admin access required.
 *
 * @async
 * @returns {JSON} Responds with the results of the bulk creation.
 * @throws {500} If an error occurs during the bulk creation.
 */
router.post('/create-bulk', verifyAdmin, async function (req, res) {
  try {
    const setuEntries = req.body;

    if (!Array.isArray(setuEntries)) {
      return res
        .status(400)
        .json({ error: 'Request body should be an array of SETU entries' });
    }

    // Build bulk operations: upsert each entry, skip if it already exists
    const operations = setuEntries.map((entry) => {
      const unitCode = entry.unit_code.toLowerCase();
      return {
        updateOne: {
          filter: {
            unit_code: unitCode,
            Season: entry.Season,
            code: entry.code,
          },
          update: { $setOnInsert: { ...entry, unit_code: unitCode } },
          upsert: true, // Create if it doesn't exist
        },
      };
    });

    // Execute all operations in one go
    const bulkResult = await SETU.bulkWrite(operations);

    // Summarise results
    const created = bulkResult.upsertedCount;
    const skipped = setuEntries.length - created;

    return res.status(201).json({
      message: 'Bulk SETU creation completed',
      totalProcessed: setuEntries.length,
      created,
      skipped,
    });
  } catch (error) {
    return res.status(500).json({
      error: `An error occurred whilst creating the SETU entries: ${error.message}`,
    });
  }
});

/**
 * ! PUT Update SETU Data
 *
 * Updates a SETU entry by ID.
 * Admin access required.
 *
 * @async
 * @returns {JSON} Responds with status 200 and the updated SETU entry.
 * @throws {404} If the SETU entry is not found.
 * @throws {500} If an error occurs while updating the SETU entry.
 */
router.put('/update/:id', verifyAdmin, async function (req, res) {
  try {
    // Find and update the SETU entry
    const updatedSetu = await SETU.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    // If the SETU entry is not found, return 404
    if (!updatedSetu) {
      return res.status(404).json({ error: 'SETU entry not found' });
    }

    // Return the updated SETU entry
    return res.status(200).json(updatedSetu);
  } catch (error) {
    return res.status(500).json({
      error: `An error occurred while updating the SETU entry: ${error.message}`,
    });
  }
});

/**
 * ! DELETE Remove SETU Entry
 *
 * Deletes a SETU entry by ID.
 * Admin access required.
 *
 * @async
 * @returns {JSON} Responds with a success message in JSON.
 * @throws {404} If the SETU entry is not found.
 * @throws {500} If an error occurs while deleting the SETU entry.
 */
router.delete('/delete/:id', verifyAdmin, async function (req, res) {
  try {
    // Find and delete the SETU entry
    const deletedSetu = await SETU.findByIdAndDelete(req.params.id);

    // If the SETU entry is not found, return 404
    if (!deletedSetu) {
      return res.status(404).json({ error: 'SETU entry not found' });
    }

    // Return success message
    return res.status(200).json({ message: 'SETU entry successfully deleted' });
  } catch (error) {
    return res.status(500).json({
      error: `An error occurred while deleting the SETU entry: ${error.message}`,
    });
  }
});

// Export the router
module.exports = router;
