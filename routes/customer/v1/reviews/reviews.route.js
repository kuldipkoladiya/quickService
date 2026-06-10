import express from 'express';
import { reviewsController } from 'controllers/customer';
import { reviewsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createReviews
   * */
  .post(auth('customer'), validate(reviewsValidation.createReviews), reviewsController.createReviews)
  /**
   * getReviews
   * */
  .get(auth('customer'), validate(reviewsValidation.getReviews), reviewsController.listReviews);
router
  .route('/paginated')
  /**
   * getReviewsPaginated
   * */
  .get(auth('customer'), validate(reviewsValidation.paginatedReviews), reviewsController.paginateReviews);
router
  .route('/:reviewsId')
  /**
   * getReviewsById
   * */
  .get(auth('customer'), validate(reviewsValidation.getReviewsById), reviewsController.getReviews)
  /**
   * updateReviews
   * */
  .put(auth('customer'), validate(reviewsValidation.updateReviews), reviewsController.updateReviews)
  /**
   * deleteReviewsById
   * */
  .delete(auth('customer'), validate(reviewsValidation.deleteReviewsById), reviewsController.removeReviews);
export default router;
