import express from 'express';
import { bookingTrackingController } from 'controllers/vendor';
import { bookingTrackingValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookingTracking
   * */
  .post(
    auth('vendor'),
    validate(bookingTrackingValidation.createBookingTracking),
    bookingTrackingController.createBookingTracking
  )
  /**
   * getBookingTracking
   * */
  .get(
    auth('vendor'),
    validate(bookingTrackingValidation.getBookingTracking),
    bookingTrackingController.listBookingTracking
  );
router
  .route('/paginated')
  /**
   * getBookingTrackingPaginated
   * */
  .get(
    auth('vendor'),
    validate(bookingTrackingValidation.paginatedBookingTracking),
    bookingTrackingController.paginateBookingTracking
  );
router
  .route('/:bookingTrackingId')
  /**
   * getBookingTrackingById
   * */
  .get(
    auth('vendor'),
    validate(bookingTrackingValidation.getBookingTrackingById),
    bookingTrackingController.getBookingTracking
  )
  /**
   * updateBookingTracking
   * */
  .put(
    auth('vendor'),
    validate(bookingTrackingValidation.updateBookingTracking),
    bookingTrackingController.updateBookingTracking
  )
  /**
   * deleteBookingTrackingById
   * */
  .delete(
    auth('vendor'),
    validate(bookingTrackingValidation.deleteBookingTrackingById),
    bookingTrackingController.removeBookingTracking
  );
export default router;
