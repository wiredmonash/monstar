// Module Imports
const express = require('express');

// Model Imports
// TODO: Import the `Review` model here (waiting for schema to be completed)

// Router instance
const router = express.Router();

/**
 * GET Get All Reviews
 * 
 * Gets all reviews from the database. 
 * 
 * @async
 * @returns {JSON} Responds with a list of all reviews in JSON format.
 * @throws {500} If an error occurs whilst fetching reviews from the database.
 */
router.get('/', async function (req, res) {
    // TODO: Code here
});


/**
 * GET Get All Reviews by Unit
 * 
 * Gets all reviews for a unit from the database.
 * 
 * @async
 * @returns {JSON} Responds with a list of all reviews in JSON format.
 * @throws {500} If an error occurs whilst fetching reviews from the database.
 */
router.get('/:unit', async function (req, res) {
    // TODO: Code here
});


/**
 * POST Create a Review for Unit
 * 
 * Creates a Review for a specific Unit
 * 
 * @async
 * @returns {JSON} Responds with the created review in JSON format
 * @throws {500} If an error occurs whilst creating a review
 */
router.post('/:unit/create', async function (req, res) {
    // TODO: Code Here
});