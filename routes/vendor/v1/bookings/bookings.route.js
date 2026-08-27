import express from 'express';
import { bookingsController } from 'controllers/vendor';
import { bookingsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookings
   * */
  .post(auth('vendor'), validate(bookingsValidation.createBookings), bookingsController.createBookings)
  /**
   * getBookings
   * */
  .get(auth('vendor'), validate(bookingsValidation.getBookings), bookingsController.listBookings);
router
  .route('/paginated')
  /**
   * getBookingsPaginated
   * */
  .get(auth('vendor'), validate(bookingsValidation.paginatedBookings), bookingsController.paginateBookings);
router
  .route('/vendor/:vendorId')
  /**
   * getBookingsByVendorId
   * */
  .get(auth('vendor'), validate(bookingsValidation.getBookingsByVendorId), bookingsController.getBookingsByVendorId);
router
  .route('/:bookingsId')
  /**
   * getBookingsById
   * */
  .get(auth('vendor'), validate(bookingsValidation.getBookingsById), bookingsController.getBookings)
  /**
   * updateBookings
   * */
  .put(auth('vendor'), validate(bookingsValidation.updateBookings), bookingsController.updateBookings)
  /**
   * deleteBookingsById
   * */
  .delete(auth('vendor'), validate(bookingsValidation.deleteBookingsById), bookingsController.removeBookings);

router
  .route('/:bookingsId/accept')
  /**
   * acceptBooking
   * */
  .put(auth('vendor'), validate(bookingsValidation.acceptBooking), bookingsController.acceptBooking)
  .post(auth('vendor'), validate(bookingsValidation.acceptBooking), bookingsController.acceptBooking);

router
  .route('/:bookingsId/cancel')
  /**
   * cancelBooking
   * */
  .put(auth('vendor'), validate(bookingsValidation.cancelBooking), bookingsController.cancelBooking)
  .post(auth('vendor'), validate(bookingsValidation.cancelBooking), bookingsController.cancelBooking);

export default router;
