const mongoose = require("mongoose");
const { Schema } = mongoose;

const setuSchema = new Schema(
  {
    unit_code: {
      type: String,
      required: true,
      index: true,
    },
    unit_name: {
      type: String,
      required: true,
    },
    code: {
      type: String, // Extended code with location and delivery info
      required: true,
    },
    Season: {
      type: String, // e.g. "2019_S1"
      required: true,
    },
    Responses: {
      type: Number,
      required: true,
    },
    Invited: {
      type: Number,
      required: true,
    },
    Response_Rate: {
      type: Number,
    },
    Level: {
      type: Number,
    },
    // Evaluation metrics (I1-I13)
    I1: {
      type: [Number], // Array of scores
    },
    I2: {
      type: [Number],
    },
    I3: {
      type: [Number],
    },
    I4: {
      type: [Number],
    },
    I5: {
      type: [Number],
    },
    I6: {
      type: [Number],
    },
    I7: {
      type: [Number],
    },
    I8: {
      type: [Number],
    },
    I9: {
      type: [Number],
    },
    I10: {
      type: [Number],
    },
    I11: {
      type: [Number],
    },
    I12: {
      type: [Number],
    },
    I13: {
      type: [Number],
    },
    agg_score: {
      type: [Number], // Aggregate score of all metrics
    },
  },
  { timestamps: true }
);

// Create compound index for faster queries
setuSchema.index({ unit_code: 1, Season: 1 });

// Static method to get SETU data by unit code
setuSchema.statics.findByUnitCode = function (unitCode) {
  return this.find({ unit_code: unitCode }).sort({ Season: -1 });
};

// Static method to get average SETU scores for a unit
setuSchema.statics.getAverageScores = function (unitCode) {
  return this.aggregate([
    { $match: { unit_code: unitCode } },
    {
      $group: {
        _id: "$unit_code",
        averageAggScore: { $avg: { $arrayElemAt: ["$agg_score", 0] } },
        totalResponses: { $sum: "$Responses" },
      },
    },
  ]);
};

const SETU = mongoose.model("SETU", setuSchema);
module.exports = SETU;
