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

router
  .route('/:bookingsId/ontheway')
  /**
   * onTheWayBooking
   * */
  .put(auth('vendor'), validate(bookingsValidation.onTheWayBooking), bookingsController.onTheWayBooking)
  .post(auth('vendor'), validate(bookingsValidation.onTheWayBooking), bookingsController.onTheWayBooking);

router
  .route('/:bookingsId/complete/send-otp')
  /**
   * sendBookingCompletionOtp
   * */
  .post(auth('vendor'), validate(bookingsValidation.sendCompletionOtp), bookingsController.sendBookingCompletionOtp);

router
  .route('/:bookingsId/send-otp')
  /**
   * alias sendBookingCompletionOtp
   * */
  .post(auth('vendor'), validate(bookingsValidation.sendCompletionOtp), bookingsController.sendBookingCompletionOtp);

router
  .route('/:bookingsId/complete/verify-otp')
  /**
   * verifyBookingCompletionOtp
   * */
  .post(auth('vendor'), validate(bookingsValidation.verifyCompletionOtp), bookingsController.verifyBookingCompletionOtp);

router
  .route('/:bookingsId/complete')
  /**
   * alias completeBooking (verify OTP)
   * */
  .post(auth('vendor'), validate(bookingsValidation.verifyCompletionOtp), bookingsController.verifyBookingCompletionOtp)
  .put(auth('vendor'), validate(bookingsValidation.verifyCompletionOtp), bookingsController.verifyBookingCompletionOtp);

router
  .route('/:bookingsId/verify-otp')
  /**
   * alias verifyBookingCompletionOtp
   * */
  .post(auth('vendor'), validate(bookingsValidation.verifyCompletionOtp), bookingsController.verifyBookingCompletionOtp);

router
  .route('/:bookingsId/complete/resend-otp')
  /**
   * resendBookingCompletionOtp
   * */
  .post(auth('vendor'), validate(bookingsValidation.resendCompletionOtp), bookingsController.resendBookingCompletionOtp);

router
  .route('/:bookingsId/resend-otp')
  /**
   * alias resendBookingCompletionOtp
   * */
  .post(auth('vendor'), validate(bookingsValidation.resendCompletionOtp), bookingsController.resendBookingCompletionOtp);

export default router;
