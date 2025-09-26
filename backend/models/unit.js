// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;

// Unit Tags
const UnitTags = {
  MOST_REVIEWS: 'most-reviews',
  CONTROVERSIAL: 'controversial',
  WAM_BOOSTER: 'wam-booster',
};

// Nested requisites schema
const RequisiteSchema = new Schema({
  NumReq: {
    type: Number,
    required: false,
  },
  units: {
    type: [String],
    required: false,
  },
});

// Unit Schema
const UnitSchema = new Schema({
  // Unit code
  unitCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    set: (value) => value.toLowerCase(),
  },

  // Name of the unit
  name: {
    type: String,
    required: true,
  },

  // Description of the unit
  description: {
    type: String,
  },

  // List of reviews for the unit
  reviews: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Review',
    },
  ],

  // Average overall rating
  avgOverallRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },

  // Average relevancy rating
  avgRelevancyRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },

  // Average faculty rating
  avgFacultyRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },

  // Average content rating
  avgContentRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },

  level: {
    type: Number,
    required: true,
  },

  creditPoints: {
    type: Number,
    required: true,
  },

  school: {
    type: String,
    required: true,
  },

  academicOrg: {
    type: String,
    required: true,
  },

  scaBand: {
    type: String,
    required: true,
  },

  requisites: {
    permission: {
      type: Boolean,
      default: false,
    },
    prohibitions: {
      type: [String],
      required: false,
    },
    corequisites: {
      type: [RequisiteSchema],
      required: false,
    },
    prerequisites: {
      type: [RequisiteSchema],
      required: false,
    },
    cpRequired: {
      type: Number,
      default: 0,
    },
  },

  offerings: [
    {
      location: { type: String, required: true },
      mode: { type: String, required: true },
      name: { type: String, required: true },
      period: { type: String, required: true },
    },
  ],

  tags: {
    type: [
      {
        type: String,
        enum: Object.values(UnitTags),
      },
    ],
    validate: [arrayLimit, 'Unit can only have up to 2 tags'],
  },

  aiOverview: {
    summary: { type: String },
    generatedAt: { type: Date },
    model: { type: String },
    totalReviewsConsidered: { type: Number },
    reviewSampleSize: { type: Number },
    setuSeasons: { type: [String], default: [] },
  },
});

// Validator function for max tags
function arrayLimit(val) {
  return val.length <= 2;
}

// Export the Unit model
const Unit = mongoose.model('Unit', UnitSchema);
module.exports = Unit;
