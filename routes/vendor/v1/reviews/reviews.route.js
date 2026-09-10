import express from 'express';
import { reviewsController } from 'controllers/vendor';
import { reviewsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();

router
  .route('/')
  /**
   * Get Reviews received by logged-in Vendor
   */
  .get(auth('vendor'), validate(reviewsValidation.getReviews), reviewsController.listReviews)
  /**
   * Legacy Create Review
   */
  .post(auth('vendor'), validate(reviewsValidation.createReviews), reviewsController.createReviews);

router
  .route('/paginated')
  /**
   * Get Paginated Reviews received by logged-in Vendor
   */
  .get(auth('vendor'), validate(reviewsValidation.paginatedReviews), reviewsController.paginateReviews);

router
  .route('/summary')
  /**
   * Get Review Rating Summary and 1-5 Star Breakdown for logged-in Vendor
   */
  .get(auth('vendor'), reviewsController.getReviewsSummary);

router
  .route('/:reviewsId')
  /**
   * Get Review by ID
   */
  .get(auth('vendor'), validate(reviewsValidation.getReviewsById), reviewsController.getReviews)
  /**
   * Legacy Update Review
   */
  .put(auth('vendor'), validate(reviewsValidation.updateReviews), reviewsController.updateReviews)
  /**
   * Legacy Delete Review
   */
  .delete(auth('vendor'), validate(reviewsValidation.deleteReviewsById), reviewsController.removeReviews);

router
  .route('/:reviewsId/reply')
  /**
   * Vendor Reply to Customer Review
   */
  .post(auth('vendor'), validate(reviewsValidation.replyReview), reviewsController.replyToReview);

export default router;
