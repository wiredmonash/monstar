import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';

import { getErrorMessage } from '@shared/utilities/getErrorMessage';

import ReviewV1Service from './review.v1.service';

/**
 * v1 reviews controllers. Each handler keeps v1's explicit try/catch and its
 * exact status codes, JSON shapes and (mis)spelled error strings — behaviour
 * pinned by the characterization tests. Do NOT switch these to asyncHandler +
 * error middleware; that would change the response bodies.
 */
class ReviewV1Controller {
  /**
   * Get all reviews (optional filter from body). No auth.
   */
  static getAll = async (req: Request, res: Response) => {
    try {
      // Find all the reviews
      const reviews = await ReviewV1Service.fetchAll(req.body);

      // Respond 200 with JSON list containing all reviews
      return res.status(200).json(reviews);
    } catch (error) {
      // NOTE: preserves v1 behavior — the catch responds 200 (not 500).
      return res.status(200).json({
        error: `An error occurred while getting all reviews: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * Get all reviews for a unit. No auth.
   */
  static getByUnit = async (req: Request, res: Response) => {
    try {
      // Get the unit code from the request parameters and convert it to lowercase
      const unitCode = req.params.unit.toLowerCase();

      // Find the unit in the database by its unit code
      const unitDoc = await ReviewV1Service.findUnitByCode(unitCode);

      // If the unit is not found, return a 404 error
      if (!unitDoc)
        return res
          .status(404)
          .json({ error: `Unit with code ${unitCode} not found` });

      // Find all reviews associated with this unit
      const reviews = await ReviewV1Service.fetchReviewsByUnitId(unitDoc._id);

      // Return the list of reviews with a 200 OK status
      return res.status(200).json(reviews);
    } catch (error) {
      // Handle any errors that occur during the process
      console.error(`An error occurred: ${getErrorMessage(error)}`);
      return res.status(500).json({
        error: `An error occurred while fetching reviews: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * Get all reviews by a user. No auth.
   */
  static getByUser = async (req: Request, res: Response) => {
    try {
      // Find all reviews by this user id directly
      const reviews = await ReviewV1Service.fetchByUserPopulated(
        req.params.userId
      );

      // Return the list of reviews with a 200 OK status
      return res.status(200).json(reviews);
    } catch (error) {
      // Handle any errors that occur during the process
      return res.status(500).json({
        error: `An error occurred while fetching reviews: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * Create a review for a unit.
   */
  static createReview = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'You are not authenticated' });
      }

      // Verify that the author in the request body matches the authenticated user
      if (req.body.review_author.toString() !== req.user.id.toString()) {
        return res.status(403).json({
          error: 'You are not authorized to created a review for this unit',
        });
      }

      // Get the unit code from parameter
      const unitCode = req.params.unit.toLowerCase();
      // Find the unit by UnitCode
      const unitDoc = await ReviewV1Service.findUnitByCode(unitCode);
      // Check if unit exists, if not, return 404 error
      if (!unitDoc)
        return res
          .status(404)
          .json({ error: `Unit with code ${unitCode} not found in DB` });

      // Check if the user has already reviewed this unit
      const existingReview = await ReviewV1Service.findReviewByAuthorAndUnit(
        req.body.review_author,
        unitDoc._id
      );

      // NOTE: preserves v1 behavior — a duplicate review responds 400 (not 409).
      if (existingReview) {
        return res
          .status(400)
          .json({ error: 'You have already reviewed this unit' });
      }

      // Create the review, mirror it into the arrays and recalc averages
      const review = await ReviewV1Service.createReview(unitDoc, {
        title: req.body.review_title,
        semester: req.body.review_semester,
        grade: req.body.review_grade,
        year: req.body.review_year,
        overallRating: req.body.review_overall_rating,
        relevancyRating: req.body.review_relevancy_rating,
        facultyRating: req.body.review_faculty_rating,
        contentRating: req.body.review_content_rating,
        description: req.body.review_description,
        author: req.body.review_author,
      });

      // Return 201 (created), and show the new Review in JSON format.
      return res.status(201).json(review);
    } catch (error) {
      // NOTE: preserves v1 behavior — error string is misspelled ("occured").
      return res.status(500).json({
        error: `An error occured while creating the Review: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * Update a review by id.
   */
  static updateReview = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'You are not authenticated' });
      }

      // Get the review to update
      const review = await ReviewV1Service.findReviewById(req.params.reviewId);
      if (!review) return res.status(404).json({ error: 'Review not found' });

      // Get the requesting user
      const requestingUser = await ReviewV1Service.findUserById(req.user.id);
      if (!requestingUser)
        return res.status(404).json({ error: 'Requesting user not found' });

      // Check if the user is authorised (review author or admin)
      const isAuthor =
        review.author.toString() === requestingUser._id.toString();
      if (!isAuthor && !requestingUser.admin) {
        return res.status(403).json({ error: 'Unauthorised to update review' });
      }

      // Update the review and recalculate the unit averages
      const updatedReview = await ReviewV1Service.applyUpdate(review, req.body);

      return res.status(200).json({
        message: 'Review successfully updated',
        review: updatedReview,
      });
    } catch (error) {
      return res.status(500).json({
        error: `Error while updating review: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * Delete a review by id.
   */
  static deleteReview = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'You are not authenticated' });
      }

      // Find the Review
      const review = await ReviewV1Service.findReviewById(req.params.reviewId);

      // Throw error if Review doesn't exist
      if (!review) return res.status(404).json({ error: 'Review not found' });

      // Get the requesting user from token
      const requestingUser = await ReviewV1Service.findUserById(req.user.id);
      if (!requestingUser)
        return res.status(404).json({ error: 'Requesting user not found' });

      // Check if the user is authorised (review author or admin)
      const isAuthor =
        review.author.toString() === requestingUser._id.toString();
      const isAdmin = requestingUser.admin;
      if (!isAuthor && !isAdmin) {
        return res
          .status(403)
          .json({ error: 'You are not authorised to delete this review' });
      }

      // Delete the review, unlink it and recalculate unit averages
      await ReviewV1Service.applyDelete(review);

      // Respond 200 and json with success message
      return res.status(200).json({ message: 'Review successfully deleted' });
    } catch (error) {
      // Respond 500 and error message
      return res.status(500).json({
        error: `Error while deleting review: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * Toggle a like/dislike reaction on a review.
   */
  static toggleReaction = async (req: Request, res: Response) => {
    try {
      const { userId, reactionType } = req.body;

      // Validate reaction type
      if (!['like', 'dislike'].includes(reactionType)) {
        return res.status(400).json({
          error: 'Invalid reaction type. Must be "like" or "dislike"',
        });
      }

      // Fetch all required documents in parallel for better performance
      const [review, user] = await Promise.all([
        ReviewV1Service.findReviewById(req.params.reviewId),
        ReviewV1Service.findUserById(userId),
      ]);

      // Check if review and user exist
      if (!review) return res.status(404).json({ error: 'Review not found' });
      if (!user) return res.status(404).json({ error: 'User not found' });

      // Fetch additional required documents
      const [unit, author] = await Promise.all([
        ReviewV1Service.findUnitById(review.unit),
        ReviewV1Service.findUserById(review.author),
      ]);

      if (!unit) return res.status(404).json({ error: 'Unit not found' });
      if (!author) return res.status(404).json({ error: 'Author not found' });

      // Apply the reaction and return the state from the saved documents
      const result = await ReviewV1Service.applyReaction(
        review,
        user,
        unit,
        author,
        reactionType
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in toggle-reaction:', error);
      return res.status(500).json({
        error: `An error occurred while toggling reaction: ${getErrorMessage(error)}`,
      });
    }
  };

  /**
   * Send a report email for a review. nodemailer is used inline here, matching
   * the accepted pattern in the v2 controller.
   */
  static sendReport = async (req: Request, res: Response) => {
    const { reportReason, reportDescription, reporterName, review } = req.body;

    try {
      // Transport settings
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Email content
      const mailOptions = {
        from: process.env.EMAIL_USERNAME,
        to: process.env.EMAIL_USERNAME,
        subject: `Report on review written by user ${review.author.username}`,
        html: `
            <p>
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
            </p>
            `,
      };

      // Send the email
      await transporter.sendMail(mailOptions);

      return res.status(201).json({ message: 'Report email sent' });
    } catch (error) {
      // NOTE: preserves v1 behavior — error string is misspelled ("occured").
      return res.status(500).json({
        error: `An error occured while sending report email: ${getErrorMessage(error)}`,
      });
    }
  };
}

export default ReviewV1Controller;
