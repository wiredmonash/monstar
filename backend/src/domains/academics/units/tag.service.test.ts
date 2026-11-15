import { Review } from '@domains/academics/reviews';
import { TagManager, Unit } from '@domains/academics/units';

describe(TagManager.name, () => {
  describe(TagManager.updateMostReviewsTag.name, () => {
    it('should move the tag to the unit with the most reviews', async () => {
      // arrange
      const [top] = await Review.aggregate([
        { $group: { _id: '$unit', reviewCount: { $sum: 1 } } },
        { $sort: { reviewCount: -1 } },
        { $limit: 1 },
      ]);
      const stale = await Unit.findOne({ _id: { $ne: top._id } });
      await Unit.updateOne({ _id: stale!._id }, { tags: ['most-reviews'] });
      // act
      await TagManager.updateMostReviewsTag(1);
      // assert
      const tagged = await Unit.find({ tags: 'most-reviews' });
      expect(tagged).toHaveLength(1);
      const reviewCount = await Review.countDocuments({ unit: tagged[0]._id });
      expect(reviewCount).toEqual(top.reviewCount);
    });

    it('should leave no unit tagged when none reaches the threshold', async () => {
      // arrange
      const unit = await Unit.findOne({});
      await Unit.updateOne({ _id: unit!._id }, { tags: ['most-reviews'] });
      // act
      await TagManager.updateMostReviewsTag(10_000);
      // assert
      expect(await Unit.countDocuments({ tags: 'most-reviews' })).toEqual(0);
    });
  });
});
