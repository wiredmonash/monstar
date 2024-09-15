// Module Imports
const express = require('express');

// Model Imports
const Review = require('../models/review');
const Unit = require('../models/unit');

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
    try {
        // Find all the reviews
        const reviews = await Review.find({});

        // Respond 200 with JSON list containing all reviews
        return res.status(200).json(reviews);
    }
    catch (error) {
        // Handle general errors
        return res.status(200).json({ error: `An error occurred while getting all reviews: ${error.message}` });
    }
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
    // TODO: Code here (Louis)
});


/**
 * POST Create a Review for Unit
 * 
 * Creates a Review for a specific Unit
 * 
 * @async
 * @returns {JSON} Responds with the created review in JSON format.
 * @throws {404} If the Unit with the given unit code from parameter doesn't exist in DB
 * @throws {500} If an error occurs whilst creating a review.
 */
router.post('/:unit/create', async function (req, res) {
    try {
        // Get the unit code from parameter
        const unitCode = req.params.unit.toLowerCase();
        // Find the unit by UnitCode
        const unitDoc = await Unit.findOne({ unitCode: unitCode });
        // Check if unit exists, if not, return 404 error
        if (!unitDoc)
           return res.status(404).json({ error: `Unit with code ${unitCode} not found in DB` });

        // The new Review object
        const review = new Review({
            title:              req.body.review_title,
            semester:           req.body.review_semester,
            grade:              req.body.review_grade,
            overallRating:      req.body.review_overall_rating,
            relevancyRating:    req.body.review_relevancy_rating,
            facultyRating:      req.body.review_faculty_rating,
            contentRating:      req.body.review_content_rating,
            description:        req.body.review_description,
            unit:               unitDoc._id
        });

        // Save the new Review in the database
        await review.save();

        // Save the Review's MongoID in the Unit's `reviews` array
        await Unit.findByIdAndUpdate(
            unitDoc._id,
            { $push: { reviews: review._id } },
            { new: true, runValidators: true }
        );

        // Return 201 (created), and show the new Review in JSON format.
        return res.status(201).json(review);
    }
    catch (error) {
        // Handle general errors 500
        return res.status(500).json({ error: `An error occured while creating the Review: ${error.message}` });
    }
});

/**
 * PUT Update a Review by MongoDB ID
 * 
 * Allows us to update the Review (e.g. Title, Grade Obtained, Ratings, ...)
 * 
 * @async
 * @returns {JSON} Responds with the updated review in JSON format
 * @throws {500} If an error occurs whilst updating a review.
 */
router.put('/:reviewId/update', async function (req, res) {
    // TODO: Code here (Riki)
});

/**
 * DELETE Delete a Review by MongoDB ID
 * 
 * Deletes a Review (also removes the review from the Unit's `reviews` array)
 * 
 * @async
 * @returns {JSON} Responds with the deleted review in JSON format
 * @throws {500} If an error occurs whilst deleting the review.
 */
router.delete('/:reviewID/delete', async function (req, res) {
    // TODO: Code here (Riki)
})


// Export the router
module.exports = router;