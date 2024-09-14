/* 
Schema and Model for a review on the platform
*/

const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
    // Review title
    title: {type: String, required: true},

    // Semester taken
    semester: {type: Number, required: true, min: 1, max: 2},

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
    unit: {type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true}
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;