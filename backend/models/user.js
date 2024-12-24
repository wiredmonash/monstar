// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { cloudinary } = require('../utils/cloudinary');

// Model imports
const Review = require('./review.js');

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

// Middlware to cascade delete reviews when a user is deleted
userSchema.pre('findOneAndDelete', async function (next) {
    const user = await this.model.findOne(this.getFilter());
    if (user) {
        // Delete the associated reviews
        await Review.deleteMany({ author: user._id });

        // Delete profile image from Cloudinary
        if (user.profileImg) {
            const urlParts = user.profileImg.split('/');
            const fileName = urlParts[urlParts.length - 1].split('.')[0];
            const publicId = `user_avatars/${fileName}`;

            cloudinary.uploader.destroy(publicId);
        }
    }
    next();
})

// Export User model
const User = mongoose.model('User', userSchema);
module.exports = User;