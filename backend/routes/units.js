// Module Imports
const express = require('express');

// Model Imports
const Unit = require('../models/unit');
const Review = require('../models/review');

// Function Imports
const { verifyAdmin } = require('../utils/verify_token.js');

// Router instance
const router = express.Router();

/**
 * ! GET Get All Units
 * 
 * Gets all units from the database. 
 * 
 * @async
 * @returns {JSON} Responds with a list of all units in JSON format.
 * @throws {500} If an error occurs whilst fetching units from the database.
 */
router.get('/', async function (req, res) {
    try {
        // Find all the units
        const units = await Unit.find({}).populate('reviews');

        // Respond 200 with JSON list containing all Units.
        return res.status(200).json(units);
    }
    catch (error) {
        // Handle general errors 500
        return res.status(500).json({ error: `An error occured while getting all Units: ${error.message}` });
    }
});

/**
 * ! GET Get Popular Units
 * 
 * Gets the ten most popular units
 * 
 * @async
 * @throws {JSON} Responds with a list of popular units in JSON format.
 * @throws {500} If an error occurs whilst fetching units from the database.
 */
router.get('/popular', async function (req, res) {
    try {
        // Fetch the ten most popular units
        const popularUnits = await Unit.aggregate([
            {
                $addFields: {
                    reviewCount: { $size: "$reviews" } // Calculate the number of reviews
                }
            },
            {
                $sort: { reviewCount: -1 } // Sort by the number of reviews in descending order
            },
            {
                $limit: 10 // Limit the results to top 10 units
            },
        ]);

        // Populate the reviews field for the resulting units
        const populatedUnits = await Unit.populate(popularUnits, {
            path: 'reviews',
            select: 'title description overallRating relevancyRating facultyRating contentRating likes dislikes'
        });

        // Respond with the popular units
        return res.status(200).json(populatedUnits);
    }
    catch (error) {
        // Handle general errors
        res.status(500).json({ message: 'An error occured while fetching popular units.' });
    }
});

/**
 * ! GET Get Unit by Unitcode
 * 
 * Gets a unit by unitcode
 * 
 * @async
 * @returns {JSON} Responds with the unit and its details in JSON format
 * @throws {500} If an error occurs whilst getting the singular unit from the database
 */
router.get('/unit/:unitcode', async function (req, res) {
    try {
        // Find the unit
        const unit = await Unit.findOne({ unitCode: req.params.unitcode });

        // 404 Unit does not exist 
        if (!unit) 
            return res.status(404).json({ error: 'Unit not found'});

        // Respond 200 with JSON of the singular unit
        return res.status(200).json(unit);
    }   
    catch (error) {
        return res.status(500).json({ error: `An error occured whilst getting the singular unit: ${error.message}`});
    }
});

/**
 * ! GET Get Units Filtered
 * 
 * Gets all units based on filter
 * 
 * @async
 * @returns {JSON} Responds with a list of all units based on the filter in JSON format.
 * @throws {500} If an error occurs whilst fetching units from the database.
 */
router.get('/filter', async function (req, res) {
    try {
        // Get the query parameters
        const { 
            offset = 0, 
            limit = 10, 
            search = '', 
            sort = 'Alphabetic', 
            showReviewed = 'false',
            showUnreviewed = 'false',
            hideNoOfferings = 'false',
            faculty, 
            semesters,
            campuses
        } = req.query;

        // Empty query object 
        const query = {};

        // Filter units based on the search query
        if (search) {
            query.$or = [
                { unitCode: { $regex: search, $options: 'i'} },
                { name: { $regex: search, $options: 'i'} }
            ];
        }
        // Filter units based on the faculty
        if (faculty && Array.isArray(faculty) && faculty.length > 0) {
            query.school = { $in: faculty.map(f => 'Faculty of ' + f) }
        } else if (faculty) {
            query.school = 'Faculty of ' + faculty;
        }
        // Filter units based on semester
        if (semesters && Array.isArray(semesters) && semesters.length > 0) {
            query.offerings = { $elemMatch: { period: { $in: semesters } } };
        } else if (semesters) {
            query.offerings = { $elemMatch: { period: semesters } };
        }
        // Filter units based on campuses
        if (campuses && Array.isArray(campuses) && campuses.length > 0) {
            query.offerings = { $elemMatch: { location: { $in: campuses } } };
        } else if (campuses) {
            query.offerings = { $elemMatch: { location: campuses } };
        }
        // Show only reviewed
        if (showReviewed === 'true') {
            query.reviews = { $exists: true, $not: { $size: 0 } };
        }
        // Show only unreviewed
        if (showUnreviewed === 'true') {
            query.reviews = { $exists: true, $size: 0 };
        }
        // Hide units with no offerings
        if (hideNoOfferings === 'true') {
            query.offerings = { $not: { $eq: null } };
        }

        // Get total count for pagination
        const total = await Unit.countDocuments(query);

        // Determine the sort criteria
        let sortCriteria;
        switch (sort) {
            case 'Alphabetic':
                sortCriteria = { unitCode: 1 };
                break;
            case 'Most Reviews':
                sortCriteria = { reviewCount: -1 };
                break;
            case 'Highest Overall':
                sortCriteria = { avgOverallRating: -1 };
                break;
            case 'Lowest Overall':
                sortCriteria = { avgOverallRating: 1 };
                break;
            default:
                sortCriteria = { unitCode: 1 };
        }

        // Get paginated units
        const units = await Unit.aggregate([
            // Match the units based on the query
            { $match: query },
            // Populate the reviews field for each unit
            { $lookup: { from: 'reviews', localField: 'reviews', foreignField: '_id', as: 'reviews' } },
            // Compute the number of reviews for each unit
            { $addFields: { reviewCount: { $size: "$reviews" } } },
            // Sort the units based on the sort criteria
            { $sort: { ...sortCriteria, _id: 1 } },
            // Skip and limit the units based on the pagination
            { $skip: Number(offset) },
            // Limit the units based on the pagination
            { $limit: Number(limit) },
        ]);

        // If no units are found, return an appropriate response
        if (!units.length) {
            return res.status(404).json({ error: 'No units match the given query' });
        }
        
        // Respond with the units and total count
        return res.status(200).json({ units, total });
    } 
    catch (error) {
        return res.status(500).json({ error: `Error fetching units: ${error.message}` });
    }
});


/**
 * ! POST Create a Unit
 * 
 * Creates a new Unit and adds it to the database.
 * 
 * TODO: Only admin can do this
 * 
 * @async
 * @returns {JSON} Responds with the created unit in JSON format
 * @throws {500} If an error occurs whilst creating a unit
 */
router.post('/create', verifyAdmin, async function (req, res) {
    try {
        const existingUnit = await Unit.findOne({
            unitCode: req.body.unit_code.toLowerCase()
        });

        if (existingUnit) {
            return res.status(400).json({error: "Unit already exists"})
        }

        // Create the Unit
        const unit = new Unit({
            unitCode:       req.body.unit_code.toLowerCase(),
            name:           req.body.unit_name,
            description:    req.body.unit_description 
        });

        // Save the new Unit
        await unit.save();

        // Return 201 (created), and show the new Unit in JSON format.
        return res.status(201).json(unit);
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while created the Unit: ${error.message}` });
    }
});

/**
 * ! POST Create Units in Bulk
 * 
 * Creates multiple units based on the input JSON data.
 * 
 * TOOD: Only admin can do this
 * 
 * @async
 * @param {JSON} req.body - Contains the JSON data for multiple units.
 * @returns {JSON} Success or error messages.
 */
router.post('/create-bulk', verifyAdmin, async function (req, res) {
    try {
        const unitData = req.body;
        const results = []

        for (const [unitCode, unitDetails] of Object.entries(unitData)) {
            const existingUnit = await Unit.findOne({ unitCode: unitCode.toLowerCase() });

            if (existingUnit) {
                results.push({ unitCode, status: 'Skipped', message: 'Unit already exists' });
                continue;
            }

            const unit = new Unit({
                unitCode: unitCode.toLowerCase(),
                name: unitDetails.title,
                description: unitDetails.description || '',
                level: unitDetails.level,
                creditPoints: parseInt(unitDetails.credit_points, 10),
                school: unitDetails.school,
                academicOrg: unitDetails.academic_org,
                scaBand: unitDetails.sca_band,
                requisites: unitDetails.requisites,
                offerings: unitDetails.offerings
            });

            await unit.save();
            results.push({ unitCode, status: 'Created' });
        }

        // Respond with the results
        return res.status(201).json({ message: 'Bulk creation completed', results });
    }
    catch (error) {
        return res.status(500).json({ error: `An error occurred whilst creating the units: ${error.message}` });
    }
});

/**
 * ! DELETE Remove a Unit
 * 
 * Deletes a Unit from the database
 * 
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {500} If an error occurs
 * @throws {404} Unit not found error
 */
router.delete('/delete/:unitcode', verifyAdmin, async function (req, res) {
    try {
        // Find and delete the unit
        const unit = await Unit.findOneAndDelete({ unitCode: req.params.unitcode });

        // If the unit is null, then we did not find it.
        if (!unit)
            return res.status(404).json({ error: "Unit not found"});

        // Respond with success message 200
        return res.status(200).json({ message: "Unit successfully deleted" });
    }
    catch (error) {
        // Handle general errors.
        return res.status(500).json({
            error: `Error occured while deleting unit: ${error.message}`
        });
    }
});

/**
 * ! PUT Update a Unit
 *  
 * Updates Unit description and/or name
 * 
 * @async
 * @returns {JSON} Responds with status 200 and success message
 * @throws {404} If the Unit is not found
 * @throws {500} If some error occurs
 */
router.put('/update/:unitcode', async function (req, res) {
    try {
        // Finding the unit
        const unit = await Unit.findOne({unitCode: req.params.unitcode})

        // If the unit doesn't exist return 404
        if (!unit) {
            return res.status(404).json({
                error: "Unit not found!"
            })
        }

        // Update the Unit
        await Unit.updateOne({   
                unitCode: req.params.unitcode
            },
            {
            $set: {
                name: req.body.unit_name || unit.name,
                description: req.body.unit_description || unit.description,
                avgOverallRating: req.body.avgOverallRating || unit.avgOverallRating,
                avgContentRating: req.body.avgContentRating || unit.avgContentRating,
                avgFacultyRating: req.body.avgFacultyRating || unit.avgFacultyRating,
                avgRelevancyRating: req.body.avgRelevancyRating || unit.avgRelevancyRating
            }
        })

        // Respond with 200 and success message
        return res.status(200).json({ msg: `Successfully updated ${req.params.unitcode}` });
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({
            error: `An error occurred while updating the unit: ${error.message}`
        })
    }
});


/**
 * ! GET Units Required-By
 * 
 * Gets all units that have the specified unit as a prerequisite
 * 
 * @async
 * @param {string} unitCode - The unit code to search for in the prerequisites
 * @returns {JSON} Array of units that require the specified unit
 * @throws {404} If unit not found
 * @throws {500} If database error occurs
 */
router.get('/:unitCode/required-by', async function (req, res) {
    try { 
        const unitCode = req.params.unitCode.toLowerCase();

        // Verify unit existance
        const unitExists = await Unit.findOne({ unitCode });
        if (!unitExists) return res.status(404).json({ error: 'Unit not found' });

        // Find units where this unit is in prerequisites
        const requiredByUnits = await Unit.find({
            'requisites.prerequisites': {
                $elemMatch: {
                    'units': { $in: [unitCode.toUpperCase(), unitCode.toLowerCase()] }
                }
            }
        }).select('unitCode name');

        return res.status(200).json(requiredByUnits);
    }
    catch (error) {
        return res.status(500).json({ error: `Error finding units requiring ${req.params.unitCode}: ${error.message}` });
    }
});

// Export the router
module.exports = router;