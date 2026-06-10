import express from 'express';
import { bookingCouponsController } from 'controllers/admin';
import { bookingCouponsValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBookingCoupons
   * */
  .post(
    auth('admin'),
    validate(bookingCouponsValidation.createBookingCoupons),
    bookingCouponsController.createBookingCoupons
  )
  /**
   * getBookingCoupons
   * */
  .get(auth('admin'), validate(bookingCouponsValidation.getBookingCoupons), bookingCouponsController.listBookingCoupons);
router
  .route('/paginated')
  /**
   * getBookingCouponsPaginated
   * */
  .get(
    auth('admin'),
    validate(bookingCouponsValidation.paginatedBookingCoupons),
    bookingCouponsController.paginateBookingCoupons
  );
router
  .route('/:bookingCouponsId')
  /**
   * getBookingCouponsById
   * */
  .get(auth('admin'), validate(bookingCouponsValidation.getBookingCouponsById), bookingCouponsController.getBookingCoupons)
  /**
   * updateBookingCoupons
   * */
  .put(auth('admin'), validate(bookingCouponsValidation.updateBookingCoupons), bookingCouponsController.updateBookingCoupons)
  /**
   * deleteBookingCouponsById
   * */
  .delete(
    auth('admin'),
    validate(bookingCouponsValidation.deleteBookingCouponsById),
    bookingCouponsController.removeBookingCoupons
  );
export default router;
