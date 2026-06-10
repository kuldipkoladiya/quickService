import express from 'express';
import { bookingTrackingController } from 'controllers/admin';
import { bookingTrackingValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookingTracking
   * */
  .post(
    auth('admin'),
    validate(bookingTrackingValidation.createBookingTracking),
    bookingTrackingController.createBookingTracking
  )
  /**
   * getBookingTracking
   * */
  .get(auth('admin'), validate(bookingTrackingValidation.getBookingTracking), bookingTrackingController.listBookingTracking);
router
  .route('/paginated')
  /**
   * getBookingTrackingPaginated
   * */
  .get(
    auth('admin'),
    validate(bookingTrackingValidation.paginatedBookingTracking),
    bookingTrackingController.paginateBookingTracking
  );
router
  .route('/:bookingTrackingId')
  /**
   * getBookingTrackingById
   * */
  .get(
    auth('admin'),
    validate(bookingTrackingValidation.getBookingTrackingById),
    bookingTrackingController.getBookingTracking
  )
  /**
   * updateBookingTracking
   * */
  .put(
    auth('admin'),
    validate(bookingTrackingValidation.updateBookingTracking),
    bookingTrackingController.updateBookingTracking
  )
  /**
   * deleteBookingTrackingById
   * */
  .delete(
    auth('admin'),
    validate(bookingTrackingValidation.deleteBookingTrackingById),
    bookingTrackingController.removeBookingTracking
  );
export default router;
