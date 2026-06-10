import express from 'express';
import { bookingTrackingController } from 'controllers/customer';
import { bookingTrackingValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookingTracking
   * */
  .post(
    auth('customer'),
    validate(bookingTrackingValidation.createBookingTracking),
    bookingTrackingController.createBookingTracking
  )
  /**
   * getBookingTracking
   * */
  .get(
    auth('customer'),
    validate(bookingTrackingValidation.getBookingTracking),
    bookingTrackingController.listBookingTracking
  );
router
  .route('/paginated')
  /**
   * getBookingTrackingPaginated
   * */
  .get(
    auth('customer'),
    validate(bookingTrackingValidation.paginatedBookingTracking),
    bookingTrackingController.paginateBookingTracking
  );
router
  .route('/:bookingTrackingId')
  /**
   * getBookingTrackingById
   * */
  .get(
    auth('customer'),
    validate(bookingTrackingValidation.getBookingTrackingById),
    bookingTrackingController.getBookingTracking
  )
  /**
   * updateBookingTracking
   * */
  .put(
    auth('customer'),
    validate(bookingTrackingValidation.updateBookingTracking),
    bookingTrackingController.updateBookingTracking
  )
  /**
   * deleteBookingTrackingById
   * */
  .delete(
    auth('customer'),
    validate(bookingTrackingValidation.deleteBookingTrackingById),
    bookingTrackingController.removeBookingTracking
  );
export default router;
