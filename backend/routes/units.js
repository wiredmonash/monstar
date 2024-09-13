// Module Imports
const express = require('express');

// Model Imports
// TODO: Import the `Review` model here (waiting for schema to be completed)

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
    // TODO: Code here
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
    // TODO: Code here
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
    // TODO: Code here
});