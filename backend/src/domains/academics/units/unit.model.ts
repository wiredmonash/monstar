import mongoose, { Schema } from 'mongoose';

const UnitTags = {
  MOST_REVIEWS: 'most-reviews',
  CONTROVERSIAL: 'controversial',
  WAM_BOOSTER: 'wam-booster',
};

const RequisiteSchema = new Schema({
  NumReq: { type: Number, required: false },
  units: { type: [String], required: false },
});

const UnitSchema = new Schema({
  unitCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
    set: (value: string) => value.toLowerCase(),
  },
  name: { type: String, required: true },
  description: { type: String },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

  avgOverallRating: { type: Number, default: 0, min: 0, max: 5 },
  avgRelevancyRating: { type: Number, default: 0, min: 0, max: 5 },
  avgFacultyRating: { type: Number, default: 0, min: 0, max: 5 },
  avgContentRating: { type: Number, default: 0, min: 0, max: 5 },

  level: { type: Number, required: true },
  creditPoints: { type: Number, required: true },
  school: { type: String, required: true },
  academicOrg: { type: String, required: true },
  scaBand: { type: String, required: true },

  requisites: {
    permission: { type: Boolean, default: false },
    prohibitions: { type: [String], required: false },
    corequisites: { type: [RequisiteSchema], required: false },
    prerequisites: { type: [RequisiteSchema], required: false },
    cpRequired: { type: Number, default: 0 },
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
    type: [{ type: String, enum: Object.values(UnitTags) }],
    validate: {
      validator: (val: unknown[]) => val.length <= 2,
      message: 'Unit can only have up to 2 tags',
    },
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

const Unit = mongoose.model('Unit', UnitSchema);
export default Unit;
