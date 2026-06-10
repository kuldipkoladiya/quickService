import express from 'express';
import { couponsController } from 'controllers/admin';
import { couponsValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createCoupons
   * */
  .post(auth('admin'), validate(couponsValidation.createCoupons), couponsController.createCoupons)
  /**
   * getCoupons
   * */
  .get(auth('admin'), validate(couponsValidation.getCoupons), couponsController.listCoupons);
router
  .route('/paginated')
  /**
   * getCouponsPaginated
   * */
  .get(auth('admin'), validate(couponsValidation.paginatedCoupons), couponsController.paginateCoupons);
router
  .route('/:couponsId')
  /**
   * getCouponsById
   * */
  .get(auth('admin'), validate(couponsValidation.getCouponsById), couponsController.getCoupons)
  /**
   * updateCoupons
   * */
  .put(auth('admin'), validate(couponsValidation.updateCoupons), couponsController.updateCoupons)
  /**
   * deleteCouponsById
   * */
  .delete(auth('admin'), validate(couponsValidation.deleteCouponsById), couponsController.removeCoupons);
export default router;
