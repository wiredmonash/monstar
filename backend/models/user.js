// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { cloudinary } = require('../utils/cloudinary');

// Model imports
const Review = require('./review.js');
const Unit = require('./unit.js');

// User Schema
const userSchema = new Schema({
    // Email
    email: { type: String, required: true },

    // Username
    username: { type: String, required: false },

    // Password
    password: { type: String, required: true },

    // Created reviews
    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

    // Profile picture
    profileImg: { type: String, required: false },

    // Admin
    admin: { type: Boolean, default: false },

    // Email verified status
    verified: { type: Boolean, default: false },
    // Email verification token
    verificationToken: { type: String, required: false },
    // Email verification token expiration
    verificationTokenExpires: { type: Date, required: false },
    // Number of verification emails sent
    verificationEmailsSent: { type: Number, default: 0 },
    // Timestamp of the last verification email sent
    lastVerificationEmail: { type: Date, required: false },

    // Liked reviews
    likedReviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
    // Disliked reviews
    dislikedReviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
});

// Middleware to set default username as authcate from email
userSchema.pre('save', function (next) {
    if (!this.username && this.email) {
        this.username = this.email.slice(0, 8);
    }

    next();
});

/**
 * * Middlware on User deletion
 * 
 * - When a user is deleted, all reviews written by the user are also deleted.
 * - The likes and dislikes of the reviews are decremented.
 * - The review averages of the units are recalculated.
 * - The profile image of the user is deleted from Cloudinary.
 * - The user's liked and disliked reviews are removed from the respective arrays in the reviews.
 * 
 * @async
 * @function pre('findOneAndDelete')
 * @param {Function} next - Callback function to pass control to the next middleware
 * @returns {void}
 * @throws {Error} - Throws error if unable to delete reviews or update units
 */
userSchema.pre('findOneAndDelete', async function (next) {
    try {
        const user = await this.model.findOne(this.getFilter());
        if (user) {
            // Get all the reviews written by the user
            const reviews = await Review.find({ author: user._id});
            // Delete the associated reviews
            await Review.deleteMany({ author: user._id });
            
            // Iterate through all the reviews that the user has written
            for (const review of reviews) {
                // Remove reviews from units' review arrays
                await Unit.updateMany(
                    { reviews: review._id },
                    { $pull: { reviews: review._id } }
                );
                
                // Fetch the unit document for recalculating averages
                const unit = await Unit.findById(review.unit);
                if (unit) {
                    // Fetch all the remaining reviews for this unit
                    const allReviews = await Review.find({ unit: unit._id });
                    // Recalculate averages based on remaining reviews
                    const avgOverallRating = allReviews.length ? allReviews.reduce((sum, rev) => sum + rev.overallRating, 0) / allReviews.length : 0;
                    const avgContentRating = allReviews.length ? allReviews.reduce((sum, rev) => sum + rev.contentRating, 0) / allReviews.length : 0;
                    const avgFacultyRating = allReviews.length ? allReviews.reduce((sum, rev) => sum + rev.facultyRating, 0) / allReviews.length : 0;
                    const avgRelevancyRating = allReviews.length ? allReviews.reduce((sum, rev) => sum + rev.relevancyRating, 0) / allReviews.length : 0;

                    // Update the unit with the new averages
                    await Unit.updateOne(
                        { _id: unit._id },
                        { 
                            avgOverallRating,
                            avgContentRating,
                            avgFacultyRating,
                            avgRelevancyRating
                        }
                    );
                }
            }

            // Decrement the likes of the liked reviews
            for (let i = 0; i < user.likedReviews.length; i++) {
                const review = await Review.findById(user.likedReviews[i]);
                if (review) {
                    review.likes = (review.likes || 0) - 1; 
                    await review.save();
                }
            }

            // Decrement the dislikes of the disliked reviews
            for (let i = 0; i < user.dislikedReviews.length; i++) {
                const review = await Review.findById(user.dislikedReviews[i]);
                if (review) {
                    review.dislikes = (review.dislikes || 0) - 1;
                    await review.save();
                }
            }

            // Delete profile image from Cloudinary
            if (user.profileImg) {
                const urlParts = user.profileImg.split('/');
                const fileName = urlParts[urlParts.length - 1].split('.')[0];
                const publicId = `user_avatars/${fileName}`;

                cloudinary.uploader.destroy(publicId);
            }
        }

        // Pass control to the next middleware
        next();
    }
    catch (error) {
        // Pass the error to the next middleware
        next(error);
    }
})

// Export User model
const User = mongoose.model('User', userSchema);
module.exports = User;