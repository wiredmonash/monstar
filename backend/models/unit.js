/* 
Schema and Model for a review on the platform
*/

// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Unit Schema
const unitSchema = new Schema({
    // Unit code
    unitCode: {
        type: String, 
        required: true, 
        unique: true, 
        index: true,
        set: value => value.toLowerCase()
    },

    // Name of the unit
    name: {type: String, required: true},

    // Description of the unit
    description: {type: String, required: true},

    // List of reviews for the unit
    reviews: [{type: mongoose.Schema.Types.ObjectId, ref: 'Review'}],

    // Average overall rating
    avgOverallRating: {type: Number, default: 0, min: 0, max: 5},

    // Average relevancy rating
    avgRelevancyRating: {type: Number, default: 0, min: 0, max: 5},

    // Average faculty rating
    avgFacultyRating: {type: Number, default: 0, min: 0, max: 5},

    // Average content rating
    avgContentRating: {type: Number, default: 0, min: 0, max: 5}
});

// Export the Unit model
const Unit = mongoose.model('Unit', unitSchema);
module.exports = Unit;