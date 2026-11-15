import { Review } from '@domains/academics/reviews';

import Unit from './unit.model';

class TagManager {
  /**
   * Move the `most-reviews` tag to the unit with the most reviews, provided it
   * has at least `threshold` of them. Otherwise no unit keeps the tag.
   */
  static async updateMostReviewsTag(threshold = 10) {
    const session = await Unit.startSession();

    try {
      await session.withTransaction(async () => {
        const [top] = await Review.aggregate([
          { $group: { _id: '$unit', reviewCount: { $sum: 1 } } },
          { $match: { reviewCount: { $gte: threshold } } },
          { $sort: { reviewCount: -1 } },
          { $limit: 1 },
        ]).session(session);

        await Unit.updateMany(
          { tags: 'most-reviews' },
          { $pull: { tags: 'most-reviews' } },
          { session }
        );

        if (top) {
          await Unit.findByIdAndUpdate(
            top._id,
            { $addToSet: { tags: 'most-reviews' } },
            { session }
          );
        }
      });
    } catch (error) {
      console.error(`[TagManager] Transaction failed: ${error}`);
    } finally {
      await session.endSession();
    }
  }
}

export default TagManager;
