import express from 'express';
import { bookingsController } from 'controllers/admin';
import { bookingsValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookings
   * */
  .post(auth('admin'), validate(bookingsValidation.createBookings), bookingsController.createBookings)
  /**
   * getBookings
   * */
  .get(auth('admin'), validate(bookingsValidation.getBookings), bookingsController.listBookings);
router
  .route('/paginated')
  /**
   * getBookingsPaginated
   * */
  .get(auth('admin'), validate(bookingsValidation.paginatedBookings), bookingsController.paginateBookings);
router
  .route('/:bookingsId')
  /**
   * getBookingsById
   * */
  .get(auth('admin'), validate(bookingsValidation.getBookingsById), bookingsController.getBookings)
  /**
   * updateBookings
   * */
  .put(auth('admin'), validate(bookingsValidation.updateBookings), bookingsController.updateBookings)
  /**
   * deleteBookingsById
   * */
  .delete(auth('admin'), validate(bookingsValidation.deleteBookingsById), bookingsController.removeBookings);
export default router;
