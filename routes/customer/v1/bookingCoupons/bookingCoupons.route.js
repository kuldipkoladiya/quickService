import express from 'express';
import { bookingCouponsController } from 'controllers/customer';
import { bookingCouponsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookingCoupons
   * */
  .post(
    auth('customer'),
    validate(bookingCouponsValidation.createBookingCoupons),
    bookingCouponsController.createBookingCoupons
  )
  /**
   * getBookingCoupons
   * */
  .get(auth('customer'), validate(bookingCouponsValidation.getBookingCoupons), bookingCouponsController.listBookingCoupons);
router
  .route('/paginated')
  /**
   * getBookingCouponsPaginated
   * */
  .get(
    auth('customer'),
    validate(bookingCouponsValidation.paginatedBookingCoupons),
    bookingCouponsController.paginateBookingCoupons
  );
router
  .route('/:bookingCouponsId')
  /**
   * getBookingCouponsById
   * */
  .get(
    auth('customer'),
    validate(bookingCouponsValidation.getBookingCouponsById),
    bookingCouponsController.getBookingCoupons
  )
  /**
   * updateBookingCoupons
   * */
  .put(
    auth('customer'),
    validate(bookingCouponsValidation.updateBookingCoupons),
    bookingCouponsController.updateBookingCoupons
  )
  /**
   * deleteBookingCouponsById
   * */
  .delete(
    auth('customer'),
    validate(bookingCouponsValidation.deleteBookingCouponsById),
    bookingCouponsController.removeBookingCoupons
  );
export default router;
