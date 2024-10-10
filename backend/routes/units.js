// Module Imports
const express = require('express');

// Model Imports
const Unit = require('../models/unit');
const Review = require('../models/review');

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
 * ! GET Get Unit by Unitcode
 * 
 * Gets a unit by unitcode
 * 
 * @async
 * @returns {JSON} Responds with the unit and its details in JSON format
 * @throws {500} If an error occurs whilst getting the singular unit from the database
 */
router.get('/:unitcode', async function (req, res) {
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
 * ! POST Create a Unit
 * 
 * Creates a new Unit and adds it to the database.
 * 
 * @async
 * @returns {JSON} Responds with the created unit in JSON format
 * @throws {500} If an error occurs whilst creating a unit
 */
router.post('/create', async function (req, res) {
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
 * ! DELETE Remove a Unit
 * 
 * Deletes a Unit from the database
 * 
 * @async
 * @returns {JSON} Responds with a success message in JSON
 * @throws {500} If an error occurs
 * @throws {404} Unit not found error
 */
router.delete('/delete/:unitcode', async function (req, res) {
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
                description: req.body.unit_description || unit.description
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

// Export the router
module.exports = router;