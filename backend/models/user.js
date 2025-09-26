// Module Imports
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { cloudinary } = require('../utils/cloudinary');

// Model imports
const Review = require('./review.js');
const Unit = require('./unit.js');
const Notification = require('./notification.js');

// User Schema
const userSchema = new Schema({
  // Email
  email: { type: String, required: true },

  // Username
  username: { type: String, required: false },

  // Password NOT required for Google users
  password: { type: String, required: false },

  // If user signed in using Google Auth
  isGoogleUser: { type: Boolean, default: false },

  // Unique Google Identifier if Google User
  googleID: { type: String, default: null },

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

  // Password reset token
  resetPasswordToken: { type: String, required: false },
  // Password reset token expiry
  resetPasswordExpires: { type: Date, required: false },
  // Rate limiting for password reset
  resetPasswordEmailsSent: { type: Number, default: 0 },
  lastResetPasswordEmail: { type: Date, required: false },

  // Liked reviews
  likedReviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  // Disliked reviews
  dislikedReviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

  // Notifications
  notifications: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', default: [] },
  ],
});

// Middleware to set default username as authcate from email
userSchema.pre('save', function (next) {
  if (!this.username && this.email) {
    this.username = this.email.slice(0, 8);
  }

  next();
});

// * Middleware for findOneAndDelete
userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    await handleUserDeletion(user);
    next();
  } catch (error) {
    next(error);
  }
});

// * Middleware for remove
userSchema.pre('remove', async function (next) {
  try {
    await handleUserDeletion(this);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * * Handles cleanup when a user is deleted
 *
 * - When a user is deleted, all reviews written by the user are also deleted.
 * - The likes and dislikes of the reviews are decremented.
 * - The average ratings of the units are recalculated.
 * - The profile image of the user is deleted from Cloudinary.
 * - The user's liked and disliked reviews are removed from the respective arrays in the reviews.
 *
 * @param {Object} user - The user document being deleted
 */
async function handleUserDeletion(user) {
  if (!user) return;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      console.log(`[User] Starting deletion process for user: ${user._id}`);

      // Get all reviews by this user
      const reviews = await Review.find({ author: user._id }).session(session);
      console.log(`[User] Found ${reviews.length} reviews to delete`);

      // Get unique unit IDs from reviews
      const unitIds = [...new Set(reviews.map((review) => review.unit))];
      console.log(`[User] Found ${unitIds.length} units to update`);

      // Delete all reviews by this user
      await Review.deleteMany({ author: user._id }).session(session);

      // Delete all user notifications
      await Notification.deleteMany({ user }).session();

      // Delete reviews from units and update averages
      if (unitIds.length > 0) {
        // A promise for each unit to update averages and remove reviews
        await Promise.all(
          unitIds.map(async (unitId) => {
            // Get averages for the unit
            const [averages] = await Review.aggregate([
              { $match: { unit: unitId } },
              {
                $group: {
                  _id: '$unit',
                  avgOverallRating: { $avg: '$overallRating' },
                  avgContentRating: { $avg: '$contentRating' },
                  avgFacultyRating: { $avg: '$facultyRating' },
                  avgRelevancyRating: { $avg: '$relevancyRating' },
                },
              },
            ]).session(session);

            // Update unit with new averages and remove reviews
            await Unit.updateOne(
              { _id: unitId },
              {
                $pull: { reviews: { $in: reviews.map((r) => r._id) } },
                $set: {
                  avgOverallRating: averages?.avgOverallRating || 0,
                  avgContentRating: averages?.avgContentRating || 0,
                  avgFacultyRating: averages?.avgFacultyRating || 0,
                  avgRelevancyRating: averages?.avgRelevancyRating || 0,
                },
              }
            ).session(session);
          })
        );
      }

      // Decrement user's likes/dislikes from other reviews
      await Promise.all([
        // Decrement likes for reviews the user liked
        Review.updateMany(
          { _id: { $in: user.likedReviews } },
          { $inc: { likes: -1 } }
        ).session(session),

        // Decrement dislikes for reviews the user disliked
        Review.updateMany(
          { _id: { $in: user.dislikedReviews } },
          { $inc: { dislikes: -1 } }
        ).session(session),
      ]);

      console.log(`[User] Updated reviews' likes/dislikes`);
    });

    // Handle profile image deletion
    if (user.profileImg) {
      try {
        const urlParts = user.profileImg.split('/');
        const fileName = urlParts[urlParts.length - 1].split('.')[0];
        const publicId = `user_avatars/${fileName}`;

        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result !== 'ok') {
          console.error(
            `[User] Error deleting profile image from Cloudinary: ${result.result}`
          );
        } else {
          console.log(
            '[User] Successfully deleted profile image from Cloudinary '
          );
        }
      } catch (cloudinaryError) {
        console.error(
          `[User] Error deleting profile image from Cloudinary: ${cloudinaryError}`
        );
      }
    }
  } catch (error) {
    console.error(`[User] Error in handleUserDeletion: ${error.message}`);
  } finally {
    await session.endSession();
    console.log(`[User] Cleanup process completed for user: ${user._id}`);
  }
}

// Export User model
const User = mongoose.model('User', userSchema);
module.exports = User;
