// Module Imports
const express = require('express');

// Model Imports
const Unit = require('../models/unit');
const Review = require('../models/review');

// Router instance
const router = express.Router();

/**
 * GET Get All Units
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
        // Handle general errors
        return res.status(500).json({ error: `An error occured while getting all Units: ${error.message}` });
    }
});


/**
 * POST Add Unit
 * 
 * Creates a new Unit and adds it to the database.
 * 
 * @async
 * @returns {JSON} Responds with the created unit in JSON format
 * @throws {500} If an error occurs whilst creating a unit
 */
router.post('/create', async function (req, res) {
    try {
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
 * DELETE Remove a Unit
 * 
 * Deletes a Unit from the database
 * 
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {500} If an error occurs
 */
router.delete('/delete/:unitcode', async function (req, res) {
    try {
        const unit = await Unit.findOneAndDelete({
            unitCode: req.params.unitcode
        });

        if (!unit) {
            return res.status(500).json({error: "Unit not found"});
        }

        // Using code 200 instead of 204 so I can send success message
        return res.status(200).json({message: "Unit successfully deleted"});
    }
    catch (error) {
        return res.status(500).json({
            error: `Error occured while deleting unit: ${error.message}`
        });
    }
});

/**
 * PUT Update a Unit
 *  
 * Updates Unit description and/or name
 * 
 * @async
 * @returns {JSON} Responds with status 200 and JSON of the updated unit
 * @throws {404} If the Unit is not found
 * @throws {500} If some error occurs
 */
router.put('/update/:unitCode', async function (req, res) {
    try {
        // Finding the unit
        const unit = await Unit.findOne({unitCode: req.params.unitCode})

        if (!unit) {    // If the unit doesn't exist, return an error
            return res.status(404).json({
                error: "Unit not found!"
            })
        }

        const result = await Unit.updateOne({   // Update the unit if it exists
            unitCode: req.params.unitCode
        },
            {
                $set: {
                    name: req.body.unit_name || unit.name,  // Fallback in case the data hasn't been provided
                    description: req.body.unit_description || unit.description
                }
            })

        return res.status(200).json({   // Success
            message: "Unit updated successfully!"
        })
    }
    catch (error) {
        return res.status(500).json({   // Error handling
            error: `An error occurred while updating the unit: ${error.message}`
        })
    }
});

// Export the router
module.exports = router;