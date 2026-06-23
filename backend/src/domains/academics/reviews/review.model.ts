import mongoose, { Schema } from 'mongoose';

const reviewSchema = new Schema(
  {
    title: { type: String, required: true },
    semester: { type: String, required: true },
    year: { type: Number, required: true },
    grade: { type: String, required: true },

    overallRating: { type: Number, required: true, min: 0, max: 5 },
    relevancyRating: { type: Number, required: true, min: 0, max: 5 },
    facultyRating: { type: Number, required: true, min: 0, max: 5 },
    contentRating: { type: Number, required: true, min: 0, max: 5 },

    description: { type: String, required: true },
    likes: { type: Number, min: 0, default: 0 },
    dislikes: { type: Number, min: 0, default: 0 },

    unit: { type: mongoose.Schema.Types.ObjectId, ref: 'Unit', required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add pre-save hook to collapse multiple newlines into a single newline
reviewSchema.pre('save', function (next) {
  if (this.description) {
    // Replace 3 or more newlines with exactly 2 newlines
    this.description = this.description.replace(/\n{3,}/g, '\n\n');
  }
  next();
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;
