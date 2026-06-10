import express from 'express';
import { reviewsController } from 'controllers/vendor';
import { reviewsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createReviews
   * */
  .post(auth('vendor'), validate(reviewsValidation.createReviews), reviewsController.createReviews)
  /**
   * getReviews
   * */
  .get(auth('vendor'), validate(reviewsValidation.getReviews), reviewsController.listReviews);
router
  .route('/paginated')
  /**
   * getReviewsPaginated
   * */
  .get(auth('vendor'), validate(reviewsValidation.paginatedReviews), reviewsController.paginateReviews);
router
  .route('/:reviewsId')
  /**
   * getReviewsById
   * */
  .get(auth('vendor'), validate(reviewsValidation.getReviewsById), reviewsController.getReviews)
  /**
   * updateReviews
   * */
  .put(auth('vendor'), validate(reviewsValidation.updateReviews), reviewsController.updateReviews)
  /**
   * deleteReviewsById
   * */
  .delete(auth('vendor'), validate(reviewsValidation.deleteReviewsById), reviewsController.removeReviews);
export default router;
