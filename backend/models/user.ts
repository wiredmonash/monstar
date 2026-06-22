import mongoose, { Schema } from 'mongoose';

import Notification from '@models/notification';
import Review from '@models/review';
import Unit from '@models/unit';
import { cloudinary } from '@providers/cloudinary.provider';

const userSchema = new Schema({
  email: { type: String, required: true },
  username: { type: String, required: false },
  password: { type: String, required: false },
  isGoogleUser: { type: Boolean, default: false },
  googleID: { type: String, default: null },
  reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  profileImg: { type: String, required: false },
  admin: { type: Boolean, default: false },

  verified: { type: Boolean, default: false },
  verificationToken: { type: String, required: false },
  verificationTokenExpires: { type: Date, required: false },
  verificationEmailsSent: { type: Number, default: 0 },
  lastVerificationEmail: { type: Date, required: false },

  resetPasswordToken: { type: String, required: false },
  resetPasswordExpires: { type: Date, required: false },
  resetPasswordEmailsSent: { type: Number, default: 0 },
  lastResetPasswordEmail: { type: Date, required: false },

  refreshToken: { type: String, required: false },
  refreshTokenExpires: { type: Date, required: false },

  likedReviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],
  dislikedReviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

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

// Middleware for findOneAndDelete
userSchema.pre('findOneAndDelete', async function (next) {
  try {
    const user = await this.model.findOne(this.getFilter());
    await handleUserDeletion(user);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Middleware for remove (legacy hook; no-op under Mongoose 8 document API)
userSchema.pre('remove' as 'deleteOne', async function (next) {
  try {
    await handleUserDeletion(this);
    next();
  } catch (error) {
    next(error as Error);
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
async function handleUserDeletion(user: any) {
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
      await Notification.deleteMany({ user }).session(session);

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
    console.error(
      `[User] Error in handleUserDeletion: ${(error as Error).message}`
    );
  } finally {
    await session.endSession();
    console.log(`[User] Cleanup process completed for user: ${user._id}`);
  }
}

const User = mongoose.model('User', userSchema);
export = User;
