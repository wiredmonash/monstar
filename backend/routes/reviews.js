// Module Imports
const express = require('express');
const nodemailer = require('nodemailer');

// Model Imports
const Review = require('../models/review');
const Unit = require('../models/unit');
const User = require('../models/user');
const Notification = require('../models/notification');

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

        // Find the unit in the database by its unit code
        const unitDoc = await Unit.findOne({ unitCode: unitCode });

        // If the unit is not found, return a 404 error
        if (!unitDoc)
            return res.status(404).json({ error: `Unit with code ${unitCode} not found` });

        // Find all reviews associated with this unit
        const reviews = await Review.find({ unit: unitDoc._id }).populate('author');

        // Return the list of reviews with a 200 OK status
        return res.status(200).json(reviews);
    } catch (error) {
        // Handle any errors that occur during the process
        console.error(`An error occurred: ${error.message}`);
        return res.status(500).json({ error: `An error occurred while fetching reviews: ${error.message}` });
    }
});


/**
 * ! GET Get All Reviews by User Id
 *
 * Gets all reviews by a specific user from the database.
 *
 * @async
 * @returns {JSON} Responds with a list of all reviews in JSON format.
 * @throws {500} If an error occurs whilst fetching reviews from the database.
 * @throws {404} If the unit is not found in the database.
 */
router.get('/user/:userId', async function (req, res) {
    try {
        // Find all reviews by this user id directly
        const reviews = await Review.find({ author: req.params.userId })
            .populate('unit')
            .populate('author');

        // Return the list of reviews with a 200 OK status
        return res.status(200).json(reviews);
    } catch (error) {
        // Handle any errors that occur during the process
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

        // Check if the user has already reviewed this unit
        const existingReview = await Review.findOne({
            author: req.body.review_author,
            unit: unitDoc._id
        });

        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this unit' });
        }

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
router.patch('/toggle-reaction/:reviewId', verifyToken, async function (req, res) {
    try {
        const { userId, reactionType } = req.body;
        
        // Validate reaction type
        if (!['like', 'dislike'].includes(reactionType)) {
            return res.status(400).json({ error: 'Invalid reaction type. Must be "like" or "dislike"' });
        }
        
        // Fetch all required documents in parallel for better performance
        const [review, user] = await Promise.all([
            Review.findById(req.params.reviewId),
            User.findById(userId)
        ]);
        
        // Check if review and user exist
        if (!review) return res.status(404).json({ error: 'Review not found' });
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Fetch additional required documents
        const [unit, author] = await Promise.all([
            Unit.findById(review.unit),
            User.findById(review.author)
        ]);
        
        if (!unit) return res.status(404).json({ error: 'Unit not found' });
        if (!author) return res.status(404).json({ error: 'Author not found' });
        
        // Initialize operations object to track changes
        const operations = {
            notificationToRemove: null,
            notificationToAdd: null,
            reactionAdded: false,
            reactionRemoved: false,
            oppositeReactionRemoved: false
        };
        
        // Handle like/dislike toggle
        if (reactionType === 'like') {
            // Check if user already liked this review
            const hasLiked = user.likedReviews.includes(review._id);
            
            if (hasLiked) {
                // Remove like
                review.likes = Math.max(0, review.likes - 1);
                user.likedReviews.pull(review._id);
                operations.reactionRemoved = true;
                
                // Find and mark notification for removal
                operations.notificationToRemove = await Notification.findOne({ 
                    user: author._id, 
                    review: review._id 
                });
            } else {
                // Add like
                review.likes++;
                user.likedReviews.push(review._id);
                operations.reactionAdded = true;
                
                // Create notification data
                operations.notificationToAdd = {
                    data: {
                        message: `${user.username} liked your review on ${unit.unitCode.toUpperCase()}`,
                        user: { username: user.username, profileImg: user.profileImg }
                    },
                    navigateTo: `/unit-overview/${unit.unitCode}`,
                    review: review._id,
                    user: author._id
                };
                
                // Check if user had disliked this review
                if (user.dislikedReviews.includes(review._id)) {
                    // Remove the dislike
                    review.dislikes = Math.max(0, review.dislikes - 1);
                    user.dislikedReviews.pull(review._id);
                    operations.oppositeReactionRemoved = true;
                }
            }
        } else { // dislike
            // Check if user already disliked this review
            const hasDisliked = user.dislikedReviews.includes(review._id);
            
            if (hasDisliked) {
                // Remove dislike
                review.dislikes = Math.max(0, review.dislikes - 1);
                user.dislikedReviews.pull(review._id);
                operations.reactionRemoved = true;
            } else {
                // Add dislike
                review.dislikes++;
                user.dislikedReviews.push(review._id);
                operations.reactionAdded = true;
                
                // Check if user had liked this review
                if (user.likedReviews.includes(review._id)) {
                    // Remove the like
                    review.likes = Math.max(0, review.likes - 1);
                    user.likedReviews.pull(review._id);
                    operations.oppositeReactionRemoved = true;
                    
                    // Find and mark notification for removal
                    operations.notificationToRemove = await Notification.findOne({
                        user: author._id,
                        review: review._id
                    });
                }
            }
        }
        
        // Process notifications
        if (operations.notificationToRemove) {
            await Notification.deleteOne({ _id: operations.notificationToRemove._id });
            
            if (author.notifications && author.notifications.includes(operations.notificationToRemove._id)) {
                author.notifications.pull(operations.notificationToRemove._id);
            }
        }
        
        if (operations.notificationToAdd) {
            const newNotification = new Notification(operations.notificationToAdd);
            await newNotification.save();
            
            // Ensure author.notifications is initialized
            if (!author.notifications) {
                author.notifications = [];
            }
            author.notifications.push(newNotification._id);
        }
        
        // Save all documents in parallel
        await Promise.all([
            review.save(),
            user.save(),
            author.save()
        ]);
        
        // Return the updated review with reaction status
        return res.status(200).json({
            review,
            reactions: {
                liked: user.likedReviews.includes(review._id),
                disliked: user.dislikedReviews.includes(review._id)
            }
        });
    } catch (error) {
        console.error('Error in toggle-reaction:', error);
        return res.status(500).json({ 
            error: `An error occurred while toggling reaction: ${error.message}` 
        });
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