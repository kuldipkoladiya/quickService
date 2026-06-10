import express from 'express';
import { couponsController } from 'controllers/vendor';
import { couponsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createCoupons
   * */
  .post(auth('vendor'), validate(couponsValidation.createCoupons), couponsController.createCoupons)
  /**
   * getCoupons
   * */
  .get(auth('vendor'), validate(couponsValidation.getCoupons), couponsController.listCoupons);
router
  .route('/paginated')
  /**
   * getCouponsPaginated
   * */
  .get(auth('vendor'), validate(couponsValidation.paginatedCoupons), couponsController.paginateCoupons);
router
  .route('/:couponsId')
  /**
   * getCouponsById
   * */
  .get(auth('vendor'), validate(couponsValidation.getCouponsById), couponsController.getCoupons)
  /**
   * updateCoupons
   * */
  .put(auth('vendor'), validate(couponsValidation.updateCoupons), couponsController.updateCoupons)
  /**
   * deleteCouponsById
   * */
  .delete(auth('vendor'), validate(couponsValidation.deleteCouponsById), couponsController.removeCoupons);
export default router;
