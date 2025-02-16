// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Review Schema
const reviewSchema = new Schema({
    // Review title
    title: { type: String, required: true },

    // Semester taken
    semester: { type: String, required: true },

    // Year taken
    year: { type: Number, required: true },

    // Grade obtained for unit
    grade: { type: String, required: true },

    // Overall rating given to the unit
    overallRating: { type: Number, required: true, min: 0, max: 5 },

    // Relevancy rating
    relevancyRating: { type: Number, required: true, min: 0, max: 5 },

    // Faculty rating
    facultyRating: { type: Number, required: true, min: 0, max: 5 },

    // Content rating
    contentRating: { type: Number, required: true, min: 0, max: 5 },

    // Review body text
    description: { type: String, required: true },

    // Likes
    likes: { type: Number, min: 0, default: 0 },

    // Dislikes
    dislikes: { type: Number, min: 0, default: 0 },

    // Reference to the unit being reviewed
    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },

    // Reference to the user who wrote the review
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
    timestamps: true
});

// Export the Review model
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;