const Unit = require('../models/unit');
const Review = require('../models/review');

class TagManager {
  static async updateMostReviewsTag(threshold = 10) {
    console.log(
      `[TagManager] Updating most-reviews tag for units with more than ${threshold} reviews`
    );
    const session = await Unit.startSession();

    try {
      await session.withTransaction(async () => {
        console.log('[TagManager] Starting transaction');

        // Find units exceeding threshold
        console.log('[TagManager] Finding unit with most reviews...');
        const unitsWithMostReviews = await Review.aggregate([
          {
            $group: {
              _id: '$unit',
              reviewCount: { $sum: 1 },
            },
          },
          {
            $match: {
              reviewCount: { $gte: threshold },
            },
          },
          {
            $sort: { reviewCount: -1 },
          },
          {
            $limit: 1,
          },
          {
            $lookup: {
              from: 'units',
              localField: '_id',
              foreignField: '_id',
              as: 'unit',
            },
          },
          {
            $unwind: '$unit',
          },
          {
            $project: {
              _id: 0,
              unit: 1,
              reviewCount: 1,
            },
          },
        ]).session(session);

        console.log(
          `[TagManager] Found ${unitsWithMostReviews.length} units exceeding threshold`
        );

        // Batch update to remove tags
        console.log('[TagManager] Removing existing most-reviews tags...');
        const removeResult = await Unit.updateMany(
          { tags: 'most-reviews' },
          { $pull: { tags: 'most-reviews' } },
          { session }
        );
        console.log(
          `[TagManager] Removed tags from ${removeResult.modifiedCount} units`
        );

        // Add tag to top unit
        if (unitsWithMostReviews.length > 0) {
          const topUnit = unitsWithMostReviews[0].unit;
          console.log(
            `[TagManager] Adding most-reviews tag to ${topUnit.unitCode}`
          );

          await Unit.findByIdAndUpdate(
            topUnit._id,
            { $addToSet: { tags: 'most-reviews' } },
            { session }
          );
          console.log('[TagManager] Tag added successfully');
        } else {
          console.log('[TagManager] No units found exceeding threshold');
        }
      });
      console.log('[TagManager] Transaction complete');
    } catch (error) {
      console.error(`[TagManager] Transaction failed: ${error}`);
    } finally {
      console.log(`[TagManager] Ending session`);
      await session.endSession();
    }
  }
}

module.exports = TagManager;
