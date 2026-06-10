import express from 'express';
import { couponsController } from 'controllers/customer';
import { couponsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createCoupons
   * */
  .post(auth('customer'), validate(couponsValidation.createCoupons), couponsController.createCoupons)
  /**
   * getCoupons
   * */
  .get(auth('customer'), validate(couponsValidation.getCoupons), couponsController.listCoupons);
router
  .route('/paginated')
  /**
   * getCouponsPaginated
   * */
  .get(auth('customer'), validate(couponsValidation.paginatedCoupons), couponsController.paginateCoupons);
router
  .route('/:couponsId')
  /**
   * getCouponsById
   * */
  .get(auth('customer'), validate(couponsValidation.getCouponsById), couponsController.getCoupons)
  /**
   * updateCoupons
   * */
  .put(auth('customer'), validate(couponsValidation.updateCoupons), couponsController.updateCoupons)
  /**
   * deleteCouponsById
   * */
  .delete(auth('customer'), validate(couponsValidation.deleteCouponsById), couponsController.removeCoupons);
export default router;
