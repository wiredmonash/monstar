import nodemailer from 'nodemailer';

import asyncHandler from '@utilities/asyncHandler';
import ReviewService from '@services/review.service';

class ReviewController {
  /**
   * Get all reviews (with optional filter from body)
   */
  static getAll = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.fetchAll(req.body);
    return res.status(200).json(reviews);
  });

  /**
   * Get N most liked reviews
   */
  static getMostLiked = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.fetchMostLiked(req.query.n as any);
    return res.status(200).json(reviews);
  });

  /**
   * Get all reviews for a specific unit
   */
  static getByUnit = asyncHandler(async (req, res) => {
    const unitCode = req.params.unit.toLowerCase();

    const reviews = await ReviewService.fetchByUnit(unitCode);
    return res.status(200).json(reviews);
  });

  /**
   * Get all reviews by a specific user
   */
  static getByUser = asyncHandler(async (req, res) => {
    const reviews = await ReviewService.fetchByUser(req.params.userId);
    return res.status(200).json(reviews);
  });

  /**
   * Create a new review for a unit
   */
  static createReview = asyncHandler(async (req, res) => {
    const unitCode = req.params.unit.toLowerCase();
    const authUserId = req.user?.id || req.user?._id;
    const requestBody = req.body || {};
    const requestedAuthorId = requestBody.author || requestBody.review_author;

    if (!authUserId) {
      return res.status(401).json({
        error: 'You are not authenticated',
      });
    }

    // Verify that the author in the request body (if provided) matches token user
    if (
      requestedAuthorId &&
      requestedAuthorId.toString() !== authUserId.toString()
    ) {
      return res.status(403).json({
        error: 'You are not authorized to create a review for this unit',
      });
    }

    // TODO: FIX THIS SLOP
    // Normalize payload to current review schema and enforce author from token
    const review = await ReviewService.createReview(unitCode, {
      ...requestBody,
      title: requestBody.title ?? requestBody.review_title,
      semester: requestBody.semester ?? requestBody.review_semester,
      grade: requestBody.grade ?? requestBody.review_grade,
      year: requestBody.year ?? requestBody.review_year,
      overallRating:
        requestBody.overallRating ?? requestBody.review_overall_rating,
      relevancyRating:
        requestBody.relevancyRating ?? requestBody.review_relevancy_rating,
      facultyRating:
        requestBody.facultyRating ?? requestBody.review_faculty_rating,
      contentRating:
        requestBody.contentRating ?? requestBody.review_content_rating,
      description: requestBody.description ?? requestBody.review_description,
      author: authUserId,
    });
    return res.status(201).json(review);
  });

  /**
   * Update a review by ID
   */
  static updateReview = asyncHandler(async (req, res) => {
    const updatedReview = await ReviewService.updateReview(
      req.params.reviewId,
      req.user.id,
      req.body
    );

    return res.status(200).json({
      message: 'Review successfully updated',
      review: updatedReview,
    });
  });

  /**
   * Delete a review by ID
   */
  static deleteReview = asyncHandler(async (req, res) => {
    await ReviewService.deleteReview(req.params.reviewId, req.user.id);

    return res.status(200).json({
      message: 'Review successfully deleted',
    });
  });

  /**
   * Toggle like/dislike on a review
   */
  static toggleReaction = asyncHandler(async (req, res) => {
    const reviewId = req.params.reviewId;
    const { userId, reactionType } = req.body;

    if (!['like', 'dislike'].includes(reactionType)) {
      return res.status(400).json({
        error: 'Invalid reaction type. Must be "like" or "dislike"',
      });
    }

    const result = await ReviewService.toggleReaction(
      reviewId,
      userId,
      reactionType
    );

    return res.status(200).json(result);
  });

  /**
   * Send report email for a review
   */
  static sendReport = asyncHandler(async (req, res) => {
    const { reportReason, reportDescription, reporterName, review } = req.body;

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USERNAME,
      to: process.env.EMAIL_USERNAME,
      subject: `Report on review written by user ${review.author.username}`,
      html: `<p>
Reporter: ${reporterName} <br>
Reason: ${reportReason} <br>
Description: ${reportDescription} <br>
<br>
Author ID: ${review.author._id} <br>
Author Username: ${review.author.username} <br>
<br>
Review ID: ${review._id} <br>
Review Title: ${review.title} <br>
Review Description: ${review.description} <br>
</p>`,
    });

    return res.status(201).json({ message: 'Report email sent' });
  });
}

export = ReviewController;
