import express from 'express';
import { bookingCouponsController } from 'controllers/vendor';
import { bookingCouponsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookingCoupons
   * */
  .post(
    auth('vendor'),
    validate(bookingCouponsValidation.createBookingCoupons),
    bookingCouponsController.createBookingCoupons
  )
  /**
   * getBookingCoupons
   * */
  .get(auth('vendor'), validate(bookingCouponsValidation.getBookingCoupons), bookingCouponsController.listBookingCoupons);
router
  .route('/paginated')
  /**
   * getBookingCouponsPaginated
   * */
  .get(
    auth('vendor'),
    validate(bookingCouponsValidation.paginatedBookingCoupons),
    bookingCouponsController.paginateBookingCoupons
  );
router
  .route('/:bookingCouponsId')
  /**
   * getBookingCouponsById
   * */
  .get(auth('vendor'), validate(bookingCouponsValidation.getBookingCouponsById), bookingCouponsController.getBookingCoupons)
  /**
   * updateBookingCoupons
   * */
  .put(
    auth('vendor'),
    validate(bookingCouponsValidation.updateBookingCoupons),
    bookingCouponsController.updateBookingCoupons
  )
  /**
   * deleteBookingCouponsById
   * */
  .delete(
    auth('vendor'),
    validate(bookingCouponsValidation.deleteBookingCouponsById),
    bookingCouponsController.removeBookingCoupons
  );
export default router;
