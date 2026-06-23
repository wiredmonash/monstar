import { Types } from 'mongoose';

import Review from '@models/review';
import Unit from '@models/unit';
import User from '@models/user';
import NotificationService from '@services/notification.service';
import ReviewService from '@services/review.service';

vi.mock('@services/notification.service');

describe(ReviewService.name, () => {
  afterEach(() => vi.clearAllMocks());

  /* -------------------------------- Retrieval ------------------------------- */

  describe(ReviewService.fetchByUnit.name, () => {
    it('should return correct reviews from the chosen unit', async () => {
      const reviews = await ReviewService.fetchByUnit('fit1049');

      const controlUnit = await Unit.findOne({ unitCode: 'fit1049' });
      const controlReviews = await Review.find({ unit: controlUnit._id });

      expect(reviews.map((r) => r.toObject())).toEqual(
        controlReviews.map((r) => r.toObject())
      );
    });
  });

  describe(ReviewService.fetchByUser.name, () => {
    it('should return the exact reviews that a user has written', async () => {
      const controlUser = await User.findById('678e359d39d199c3f6b3b44f');
      const controlReviews = new Set(controlUser.reviews.map((r) => r._id));
      const reviews = new Set(
        (await ReviewService.fetchByUser(controlUser._id)).map((r) => r._id)
      );

      expect(controlReviews).toEqual(reviews);
    });
  });

  /* -------------------------------- Creation -------------------------------- */

  describe(ReviewService.createReview.name, () => {
    it('should create a new review in the database', async () => {
      // arrange
      const unitCode = 'fit5145';
      const author = '678e359d39d199c3f6b3b44f';
      const unitBeforeReview = await Unit.findOne({ unitCode: unitCode });

      // act
      const newReview = await ReviewService.createReview(unitCode, {
        title: 'Testing title',
        semester: 'Semester 2',
        grade: 'HD',
        year: 2025,
        overallRating: 5,
        relevancyRating: 5,
        contentRating: 5,
        facultyRating: 5,
        description: 'The quick brown fox jumps over the lazy dog',
        author: author as unknown as Types.ObjectId,
      });

      // assert
      // check if review got stored in unit
      const newReviewId = newReview._id;
      const reviewedUnit = await Unit.findOne({ unitCode: unitCode });
      const foundReviewId = reviewedUnit.reviews.find((r) =>
        r.equals(newReviewId)
      );
      expect(newReviewId).toEqual(foundReviewId);

      // check if review is in stored in user
      const user = await User.findById(author);
      const reviewIdInUser = user.reviews.find((r) => r.equals(newReviewId));
      expect(newReviewId).toEqual(reviewIdInUser);

      // check if averages are recalculated after review creation
      expect(reviewedUnit.avgOverallRating).toBeGreaterThan(
        unitBeforeReview.avgOverallRating
      );
      expect(reviewedUnit.avgContentRating).toBeGreaterThan(
        unitBeforeReview.avgContentRating
      );
      expect(reviewedUnit.avgFacultyRating).toBeGreaterThan(
        unitBeforeReview.avgFacultyRating
      );
      expect(reviewedUnit.avgRelevancyRating).toBeGreaterThan(
        unitBeforeReview.avgRelevancyRating
      );
    });
  });

  /* -------------------------------- Reactions ------------------------------- */

  describe(ReviewService.toggleReaction.name, () => {
    const TEST_REVIEW = '67ace2823004f1f8e6d8f6be';
    const TEST_USER = '679196d09f43c367d007afad';

    it('should give a like reaction to a review', async () => {
      // arrange
      const reviewId = TEST_REVIEW;
      const userId = TEST_USER;
      const reactionType = 'like';
      // act
      const reviewBefore = await Review.findOne({ _id: reviewId });
      const { review: reviewAfter, reactions } =
        await ReviewService.toggleReaction(reviewId, userId, reactionType);
      // assert
      expect(reviewBefore.likes).toBeLessThan(reviewAfter.likes);
      expect(reactions.liked).toBeTruthy();
      expect(reactions.disliked).not.toBeTruthy();

      expect(NotificationService.createLike).toHaveBeenCalledTimes(1);
    });

    it('should give a dislike reaction to a review', async () => {
      // arrange
      const reviewId = TEST_REVIEW;
      const userId = TEST_USER;
      const reactionType = 'dislike';
      // act
      const reviewBefore = await Review.findOne({ _id: reviewId });
      const { review: reviewAfter, reactions } =
        await ReviewService.toggleReaction(reviewId, userId, reactionType);
      // assert
      expect(reviewBefore.dislikes).toBeLessThan(reviewAfter.dislikes);
      expect(reactions.disliked).toBeTruthy();
      expect(reactions.liked).not.toBeTruthy();
    });

    it('should give a like and then dislike, exclusively', async () => {
      // arrange
      const reviewId = TEST_REVIEW;
      const userId = TEST_USER;
      const reactionFlow = ['like', 'dislike'];
      // act
      let reviewBefore = await Review.findOne({ _id: reviewId });
      const { review, reactions } = await ReviewService.toggleReaction(
        reviewId,
        userId,
        reactionFlow[0]
      );
      // assert
      expect(reviewBefore.likes).toBeLessThan(review.likes);
      expect(reactions.liked).toBeTruthy();
      expect(reactions.disliked).not.toBeTruthy();
      // act
      reviewBefore = await Review.findOne({ _id: reviewId });
      const { review: review2, reactions: reactions2 } =
        await ReviewService.toggleReaction(reviewId, userId, reactionFlow[1]);
      // assert
      expect(reviewBefore.dislikes).toBeLessThan(review2.dislikes);
      expect(reviewBefore.likes).not.toBeLessThan(review.likes); // like should've been removed
      expect(reactions2.disliked).toBeTruthy();
      expect(reactions2.liked).not.toBeTruthy();

      expect(NotificationService.delete).toHaveBeenCalledTimes(1);
    });
  });
});
