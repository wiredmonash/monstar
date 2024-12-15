// Module Imports
const express = require('express');

// Model Imports
const Review = require('../models/review');
const Unit = require('../models/unit');
const User = require('../models/user');

// Router instance
const router = express.Router();

/**
 * ! GET Get All Reviews
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
        const reviews = await Review.find(req.body).populate('author');

        // Respond 200 with JSON list containing all reviews
        return res.status(200).json(reviews);
    }
    catch (error) {
        // Handle general errors
        return res.status(200).json({ error: `An error occurred while getting all reviews: ${error.message}` });
    }
});

/**
 * ! GET Get All Reviews by Unit
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
        const reviews = await Review.find({ unit: unitDoc._id }).populate('author');
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
 * ! POST Create a Review for Unit
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
            author:             req.body.review_author,
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

        // Save the Review's MongoID in the User's `reviews` array
        await User.findByIdAndUpdate(
            req.body.review_author,
            { $push: { reviews: review._id } },
            { new: true, runValidators: true }
        );

        // Recalculate the averages after adding the review
        const allReviews = await Review.find({ unit: unitDoc._id });
        const avgOverallRating = allReviews.reduce((sum, rev) => sum + rev.overallRating, 0) / allReviews.length;
        const avgContentRating = allReviews.reduce((sum, rev) => sum + rev.contentRating, 0) / allReviews.length;
        const avgFacultyRating = allReviews.reduce((sum, rev) => sum + rev.facultyRating, 0) / allReviews.length;
        const avgRelevancyRating = allReviews.reduce((sum, rev) => sum + rev.relevancyRating, 0) / allReviews.length;

        // Update the unit with new averages
        await Unit.updateOne(
            { _id: unitDoc._id },
            {
                avgOverallRating,
                avgContentRating,
                avgFacultyRating,
                avgRelevancyRating
            }
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
 * ! PUT Update a Review by MongoDB ID
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

        // Recalculate the averages after adding the review
        const allReviews = await Review.find({ unit: unitDoc._id });
        const avgOverallRating = allReviews.reduce((sum, rev) => sum + rev.overallRating, 0) / allReviews.length;
        const avgContentRating = allReviews.reduce((sum, rev) => sum + rev.contentRating, 0) / allReviews.length;
        const avgFacultyRating = allReviews.reduce((sum, rev) => sum + rev.facultyRating, 0) / allReviews.length;
        const avgRelevancyRating = allReviews.reduce((sum, rev) => sum + rev.relevancyRating, 0) / allReviews.length;

        // Update the unit with new averages
        await Unit.updateOne(
            { _id: unitDoc._id },
            {
                avgOverallRating,
                avgContentRating,
                avgFacultyRating,
                avgRelevancyRating
            }
        );

        res.status(200).json({message: "Review successfully updated"});
    }
    catch (error) {
        res.status(500).json({error: `Error while updating review: ${error.message}`});
    }
});

/**
 * ! DELETE Delete a Review by MongoDB ID
 * 
 * Deletes a Review (also removes the review from the Unit's `reviews` array)
 * 
 * @async
 * @returns {JSON} Responds with the deleted review in JSON format
 * @throws {500} If an error occurs whilst deleting the review.
 */
router.delete('/delete/:reviewId', async function (req, res) {
    try {
        // Find the Review
        const review = await Review.findById(req.params.reviewId);

        // Throw error if Review doesn't exist
        if (!review)
            return res.status(404).json({error: "Review not found"});

        // Extract the unit ID from the review
        const unitId = review.unit;

        // Delete the Review from the database
        await Review.findByIdAndDelete(req.params.reviewId); 

        // Removing the review from the Unit's `reviews` array
        await Unit.findByIdAndUpdate(unitId, { $pull : { reviews: req.params.reviewId } } );

        // Fetch the unit document for recalculating averages
        const unitDoc = await Unit.findById(unitId);

        // If the unit exists, recalculate the averages
        if (unitDoc) {
            // Fetch all the reviews for this unit
            const allReviews = await Review.find({ unit: unitDoc._id });

            // Recalculate averages based on remaining reviews
            const avgOverallRating = allReviews.length ? 
                allReviews.reduce((sum, rev) => sum + rev.overallRating, 0) / allReviews.length : 0;
            const avgContentRating = allReviews.length ? 
                allReviews.reduce((sum, rev) => sum + rev.contentRating, 0) / allReviews.length : 0;
            const avgFacultyRating = allReviews.length ? 
                allReviews.reduce((sum, rev) => sum + rev.facultyRating, 0) / allReviews.length : 0;
            const avgRelevancyRating = allReviews.length ? 
                allReviews.reduce((sum, rev) => sum + rev.relevancyRating, 0) / allReviews.length : 0;

            // Update the unit document with new averages
            await Unit.updateOne(
                { _id: unitDoc._id },
                {
                    avgOverallRating,
                    avgContentRating,
                    avgFacultyRating,
                    avgRelevancyRating
                }
            );
        }

        // Respond 200 and json with success message
        res.status(200).json({message: "Review successfully deleted"});
    }
    catch (error) {
        // Respond 500 and error message
        res.status(500).json({error: `Error while deleting review: ${error.message}`});
    }
})

/**
 * ! PATCH Like a Review
 * 
 * Increments the `likes` field for a specific review by it's ID.
 * 
 * @async
 * @returns {JSON} Responds with the updated review in JSON format.
 * @throws {404} If the review is not found in the database.
 * @throws {500} If an error occurs while updating the review.
 */
router.patch('/like/:reviewId', async function (req, res) {
    try {
        // Find the review by ID and increment the likes count
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { $inc: { likes: 1 } },
            { new: true }
        );

        if (!updatedReview)
            return res.status(404).json({ error: 'Review not found' });

        // Return the updated review
        return res.status(200).json(updatedReview);
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while liking the review: ${error.message}` });
    }
});

/**
 * ! PATCH Un-Like a Review
 * 
 * Decrements the `likes` field for a specific review by it's ID.
 * 
 * @async
 * @returns {JSON} Responds with the updated review in JSON format.
 * @throws {404} If the review is not found in the database.
 * @throws {500} If an error occurs while updating the review.
 */
router.patch('/unlike/:reviewId', async function (req, res) {
    try {
        // Find the review by ID and decrement the likes count
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { $inc: { likes: -1 } },
            { new: true }
        );

        if (!updatedReview)
            return res.status(404).json({ error: 'Review not found' });

        // Return the updated review
        return res.status(200).json(updatedReview);
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while un-liking the review: ${error.message}` });
    }
});

/**
 * ! PATCH Dislike a Review
 * 
 * Increments the `dislikes` field for a specific review by its ID.
 * 
 * @async
 * @returns {JSON} Responds with the updated review in JSON format.
 * @throws {404} If the review is not found in the database.
 * @throws {500} If an error occurs while updating the review.
 */
router.patch('/dislike/:reviewId', async function (req, res) {
    try {
        // Find the review by ID and increment the dislikes count
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { $inc: { dislikes: 1 } },
            { new: true }
        );

        if (!updatedReview)
            return res.status(404).json({ error: 'Review not found' });
        
        // Return the updated review
        return res.status(200).json(updatedReview);
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while disliking the review: ${error.message}` });
    }
})

/**
 * ! PATCH Un-Dislike a Review
 * 
 * Decrements the `dislikes` field for a specific review by its ID.
 * 
 * @async
 * @returns {JSON} Responds with the updated review in JSON format.
 * @throws {404} If the review is not found in the database.
 * @throws {500} If an error occurs while updating the review.
 */
router.patch('/undislike/:reviewId', async function (req, res) {
    try {
        // Find the review by ID and decrement the dislikes count
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.reviewId,
            { $inc: { dislikes: -1 } },
            { new: true }
        );

        if (!updatedReview)
            return res.status(404).json({ error: 'Review not found' });
        
        // Return the updated review
        return res.status(200).json(updatedReview);
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while un-disliking the review: ${error.message}` });
    }
})

// Export the router
module.exports = router;