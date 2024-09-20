/* 
Schema and Model for a review on the platform
*/

// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Review Schema
const reviewSchema = new Schema({
    // Review title
    title: {type: String, required: true},

    // Semester taken
    semester: {type: Number, required: true, min: 1, max: 2},

    // Year taken
    year: {type: Number, required: true},

    // Grade obtained for unit
    grade: {type: Number, min: 0, max: 100},

    // Overall rating given to the unit
    overallRating: {type: Number, required: true, min: 1, max: 5},

    // Relevancy rating
    relevancyRating: {type: Number, required: true, min: 1, max: 5},

    // Faculty rating
    facultyRating: {type: Number, required: true, min: 1, max: 5},

    // Content rating
    contentRating: {type: Number, required: true, min: 1, max: 5},

    // Review body text
    description: {type: String, required: true},

    // Reference to the unit being reviewed
    unit: {type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true} //! Change required to true 
});

// Export the Review model
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;