// Module Imports
const express = require('express');
const nodemailer = require('nodemailer');

// Model Imports
const Review = require('../models/review');
const Unit = require('../models/unit');
const User = require('../models/user');

// Function Imports
const { verifyToken }= require('../utils/verify_token.js');

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
 * ! GET Get All Reviews by Author
 *
 * Gets all reviews for a unit from the database.
 *
 * @async
 * @returns {JSON} Responds with a list of all reviews in JSON format.
 * @throws {500} If an error occurs whilst fetching reviews from the database.
 * @throws {404} If the unit is not found in the database.
 */
router.get('/author/:author', async function (req, res) {
    try {
        // Get the author's name from the request parameters and convert it to lowercase
        const authorName = req.params.author;
        console.log(`Searching for ${authorName}`)
        // const authors = await User.find({})
        // console.log(authors)
        const author = await User.findOne({username: authorName})
        console.log(`Fetching reviews for author: ${author}`);

        // Find all reviews associated with this unit
        const reviews = await Review.find({ author: author._id }).populate('author').populate('unit');
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
router.post('/:unit/create', verifyToken, async function (req, res) {
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
router.put('/update/:reviewId', verifyToken, async function (req, res) {
    try {
        // Get the review to update
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        // Get the requesting user
        const requestingUser = await User.findById(req.user.id);
        if (!requestingUser) return res.status(404).json({ error: 'Requesting user not found' });

        // Check if the user is authorised (review author or admin)
        const isAuthor = review.author.toString() === requestingUser._id.toString();
        if (!isAuthor && !requestingUser.admin) {
            return res.status(403).json({ error: 'Unauthorised to update review' });
        }

        // Update the review
        const updatedReview = await Review.findByIdAndUpdate(
            req.params.reviewId,
            req.body,
            { new: true }
        );

        // Recalculate the averages after adding the review
        const allReviews = await Review.find({ unit: review.unit });
        const avgOverallRating = allReviews.reduce((sum, rev) => sum + rev.overallRating, 0) / allReviews.length;
        const avgContentRating = allReviews.reduce((sum, rev) => sum + rev.contentRating, 0) / allReviews.length;
        const avgFacultyRating = allReviews.reduce((sum, rev) => sum + rev.facultyRating, 0) / allReviews.length;
        const avgRelevancyRating = allReviews.reduce((sum, rev) => sum + rev.relevancyRating, 0) / allReviews.length;

        // Update the unit with new averages
        await Unit.updateOne(
            { _id: review._id },
            {
                avgOverallRating,
                avgContentRating,
                avgFacultyRating,
                avgRelevancyRating
            }
        );

        return res.status(200).json({message: "Review successfully updated", review: updatedReview });
    }
    catch (error) {
        return res.status(500).json({error: `Error while updating review: ${error.message}`});
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
router.delete('/delete/:reviewId', 
    async function (req, res) {
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

        // Delete the Review from the User's reviews array
        await User.findByIdAndUpdate(review.author, { $pull : { reviews: req.params.reviewId } } ); 

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
 * ! PATCH Toggle Like/Dislike a Review
 * 
 * Toggles the `likes` or `dislikes` field for a specific review by its ID. 
 * 
 * @async
 * @returns {JSON} Responds with the updated review in JSON format.
 * @throws {404} If the review or user is not found in the database.
 * @throws {500} If an error occurs while updating the review.
 */
router.patch('/toggle-like-dislike/:reviewId', verifyToken, async function (req, res) {
    try {
        const { userId, action } = req.body;

        // Find the review by ID
        const review = await Review.findById(req.params.reviewId);
        if (!review) return res.status(404).json({ error: 'Review not found' });

        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (action === 'like') {
            if (user.likedReviews.includes(review._id)) {
                // Unlike the review
                review.likes--;
                user.likedReviews.pull(review._id);
            } else {
                // Like the review
                review.likes++;
                user.likedReviews.push(review._id);

                // If the user had disliked the review, remove the dislike
                if (user.dislikedReviews.includes(review._id)) {
                    review.dislikes--;
                    user.dislikedReviews.pull(review._id);
                }
            }
        } else if (action === 'dislike') {
            if (user.dislikedReviews.includes(review._id)) {
                // Undislike the review
                review.dislikes--;
                user.dislikedReviews.pull(review._id);
            } else {
                // Dislike the review
                review.dislikes++;
                user.dislikedReviews.push(review._id);

                // If the user had liked the review, remove the like
                if (user.likedReviews.includes(review._id)) {
                    review.likes--;
                    user.likedReviews.pull(review._id);
                }
            }
        } else if (action === 'unlike') {
            if (user.likedReviews.includes(review._id)) {
                // Unlike the review
                review.likes--;
                user.likedReviews.pull(review._id);
            } else {
                return res.status(400).json({ error: 'Review not liked by user' });
            }
        } else if (action === 'undislike') {
            if (user.dislikedReviews.includes(review._id)) {
                // Undislike the review
                review.dislikes--;
                user.dislikedReviews.pull(review._id);
            } else {
                return res.status(400).json({ error: 'Review not disliked by user' });
            }
        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }

        // Save the updated review and user
        await review.save();
        await user.save();

        // Return the updated review
        return res.status(200).json(review);
    }
    catch (error) {
        // Handle general errors
        return res.status(500).json({ error: `An error occured while toggling like/dislike: ${error.message}` });
    }
});

/**
 * ! POST Send Report Email
 * 
 * Sends an email corresponding to a user's report on a review
 * 
 * @async
 * @throws {500} if error occurs when sending the report email
 */
router.post('/send-report', async function (req, res) {
    const {
        reportReason,
        reportDescription,
        reporterName,
        review
    } = req.body;

    try {
        // Transport settings
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: process.env.EMAIL_USERNAME,
            subject: `Report on review written by user ${review.author.username}`,
            html: `
            <p>
            Reporter: ${reporterName} <br>
            Reason: ${reportReason} <br>
            Description: ${reportDescription} <br>
            <br>
            Author ID: ${review.author._id} <br>
            Author Username: ${review.author.username} <br>
            <br>
            Review ID: ${review._id} <br>
            Review Title: ${review.title} <br>
            Review Description: ${review.description} <br>
            </p>
            `
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        return res.status(201).json({ message: "Report email sent" });
    }
    catch (error) {
        return res.status(500).json({ error: `An error occured while sending report email: ${error.message}` });
    }
});

// Export the router
module.exports = router;