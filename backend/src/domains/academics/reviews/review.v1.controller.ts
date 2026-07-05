import type { Request, Response } from 'express';
import nodemailer from 'nodemailer';

import { getErrorMessage } from '@shared/utilities/getErrorMessage';

/**
 * v1 reviews controllers. The handler keeps v1's explicit try/catch and its
 * exact status codes, JSON shapes and (mis)spelled error strings — behaviour
 * pinned by the characterization tests. Do NOT switch this to asyncHandler +
 * error middleware; that would change the response bodies.
 */
class ReviewV1Controller {
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
