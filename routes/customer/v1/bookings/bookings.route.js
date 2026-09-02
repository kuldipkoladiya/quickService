import express from 'express';
import { bookingsController } from 'controllers/customer';
import { bookingsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookings
   * */
  .post(auth('customer'), validate(bookingsValidation.createBookings), bookingsController.createBookings)
  /**
   * getBookings
   * */
  .get(auth('customer'), validate(bookingsValidation.getBookings), bookingsController.listBookings);
router
  .route('/paginated')
  /**
   * getBookingsPaginated
   * */
  .get(auth('customer'), validate(bookingsValidation.paginatedBookings), bookingsController.paginateBookings);
router
  .route('/customer/:customerId')
  /**
   * getBookingsByCustomerId
   * */
  .get(auth('customer'), validate(bookingsValidation.getBookingsByCustomerId), bookingsController.getBookingsByCustomerId);
router
  .route('/:bookingsId')
  /**
   * getBookingsById
   * */
  .get(auth('customer'), validate(bookingsValidation.getBookingsById), bookingsController.getBookings)
  /**
   * updateBookings
   * */
  .put(auth('customer'), validate(bookingsValidation.updateBookings), bookingsController.updateBookings)
  /**
   * deleteBookingsById
   * */
  .delete(auth('customer'), validate(bookingsValidation.deleteBookingsById), bookingsController.removeBookings);

router
  .route('/:bookingsId/cancel')
  /**
   * cancelBooking
   * */
  .put(auth('customer'), validate(bookingsValidation.cancelBooking), bookingsController.cancelBooking)
  .post(auth('customer'), validate(bookingsValidation.cancelBooking), bookingsController.cancelBooking);

export default router;
