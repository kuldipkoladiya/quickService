import express from 'express';
import { reviewsController } from 'controllers/admin';
import { reviewsValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createReviews
   * */
  .post(auth('admin'), validate(reviewsValidation.createReviews), reviewsController.createReviews)
  /**
   * getReviews
   * */
  .get(auth('admin'), validate(reviewsValidation.getReviews), reviewsController.listReviews);
router
  .route('/paginated')
  /**
   * getReviewsPaginated
   * */
  .get(auth('admin'), validate(reviewsValidation.paginatedReviews), reviewsController.paginateReviews);
router
  .route('/:reviewsId')
  /**
   * getReviewsById
   * */
  .get(auth('admin'), validate(reviewsValidation.getReviewsById), reviewsController.getReviews)
  /**
   * updateReviews
   * */
  .put(auth('admin'), validate(reviewsValidation.updateReviews), reviewsController.updateReviews)
  /**
   * deleteReviewsById
   * */
  .delete(auth('admin'), validate(reviewsValidation.deleteReviewsById), reviewsController.removeReviews);
export default router;
