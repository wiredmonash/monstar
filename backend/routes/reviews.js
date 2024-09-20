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
 * Gets all reviews from the database with an optional filter in the req.body
 * 
 * @async
 * @returns {JSON} Responds with a list of all reviews in JSON format.
 * @throws {500} If an error occurs whilst fetching reviews from the database.
 */
router.get('/', async function (req, res) {
    try {
        // Find all the reviews
        const reviews = await Review.find(req.body);

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
 * @throws {404} If the unit is not found in the database.
 */
router.get('/:unit', async function (req, res) {
    try {
        // Get the unit code from the request parameters and convert it to lowercase
        const unitCode = req.params.unit.toLowerCase();
        //console.log(`Fetching reviews for unit: ${unitCode}`);

        // Find the unit in the database by its unit code
        const unitDoc = await Unit.findOne({ unitCode: unitCode });

        // If the unit is not found, return a 404 error
        if (!unitDoc) {
            console.error(`Unit with code ${unitCode} not found`);
            return res.status(404).json({ error: `Unit with code ${unitCode} not found` });
        }

        // Find all reviews associated with this unit
        const reviews = await Review.find({ unit: unitDoc._id });
        // console.log(`Found ${reviews.length} reviews for unit ${unitCode}`);

        // Return the list of reviews with a 200 OK status
        return res.status(200).json(reviews);
    } catch (error) {
        // Handle any errors that occur during the process
        console.error(`An error occurred: ${error.message}`);
        return res.status(500).json({ error: `An error occurred while fetching reviews: ${error.message}` });
    }
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
            year:               req.body.review_year,
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
router.put('/update/:reviewId', async function (req, res) {
    try {
        const updatedReview = await Review.findByIdAndUpdate(
            // Find using parsed MongoDB ObjectID
            req.params.reviewId,
            // Update with the json body being sent
            req.body
        );

        // Error if review doesn't exist in db
        if (!updatedReview) {
            res.status(500).json({error: "Review not found"});
        }

        res.status(200).json({message: "Review successfully updated"});
    }
    catch (error) {
        res.status(500).json({error: `Error while updating review: ${error.message}`});
    }
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
router.delete('/delete/:reviewId', async function (req, res) {
    try {
        const review = await Review.findByIdAndDelete(req.params.reviewId);

        // Throw error if review doesn't exist
        if (!review) {
            return res.status(500).json({error: "Review not found"});
        }

        res.status(200).json({message: "Review successfully deleted"});
    }
    catch (error) {
        res.status(500).json({error: `Error while deleting review: ${error.message}`});
    }
})


// Export the router
module.exports = router;