import express from 'express';
import { payoutsController } from 'controllers/admin';
import { payoutsValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createPayouts
   * */
  .post(auth('admin'), validate(payoutsValidation.createPayouts), payoutsController.createPayouts)
  /**
   * getPayouts
   * */
  .get(auth('admin'), validate(payoutsValidation.getPayouts), payoutsController.listPayouts);
router
  .route('/paginated')
  /**
   * getPayoutsPaginated
   * */
  .get(auth('admin'), validate(payoutsValidation.paginatedPayouts), payoutsController.paginatePayouts);
router
  .route('/:payoutsId')
  /**
   * getPayoutsById
   * */
  .get(auth('admin'), validate(payoutsValidation.getPayoutsById), payoutsController.getPayouts)
  /**
   * updatePayouts
   * */
  .put(auth('admin'), validate(payoutsValidation.updatePayouts), payoutsController.updatePayouts)
  /**
   * deletePayoutsById
   * */
  .delete(auth('admin'), validate(payoutsValidation.deletePayoutsById), payoutsController.removePayouts);
export default router;
