import express from 'express';
import { reviewsController } from 'controllers/customer';
import { reviewsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();

router
  .route('/')
  /**
   * Submit Review
   */
  .post(auth('customer'), validate(reviewsValidation.createReviews), reviewsController.createReviews)
  /**
   * Get Reviews (my reviews or reviews of vendor via ?vendorId=...)
   */
  .get(auth('customer'), validate(reviewsValidation.getReviews), reviewsController.listReviews);

router
  .route('/paginated')
  /**
   * Get Paginated Reviews
   */
  .get(auth('customer'), validate(reviewsValidation.paginatedReviews), reviewsController.paginateReviews);

router
  .route('/booking/:bookingId')
  /**
   * Get Review for a Specific Booking
   */
  .get(auth('customer'), validate(reviewsValidation.getReviewByBooking), reviewsController.getReviewByBooking);

router
  .route('/vendor/:vendorId/summary')
  /**
   * Get Rating Breakdown and Stats for a Vendor
   */
  .get(auth('customer'), validate(reviewsValidation.getVendorReviewSummary), reviewsController.getVendorReviewSummary);

router
  .route('/:reviewsId')
  /**
   * Get Review by ID
   */
  .get(auth('customer'), validate(reviewsValidation.getReviewsById), reviewsController.getReviews)
  /**
   * Update Review
   */
  .put(auth('customer'), validate(reviewsValidation.updateReviews), reviewsController.updateReviews)
  /**
   * Delete Review
   */
  .delete(auth('customer'), validate(reviewsValidation.deleteReviewsById), reviewsController.removeReviews);

export default router;
