import express from 'express';
import { payoutsController } from 'controllers/customer';
import { payoutsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createPayouts
   * */
  .post(auth('customer'), validate(payoutsValidation.createPayouts), payoutsController.createPayouts)
  /**
   * getPayouts
   * */
  .get(auth('customer'), validate(payoutsValidation.getPayouts), payoutsController.listPayouts);
router
  .route('/paginated')
  /**
   * getPayoutsPaginated
   * */
  .get(auth('customer'), validate(payoutsValidation.paginatedPayouts), payoutsController.paginatePayouts);
router
  .route('/:payoutsId')
  /**
   * getPayoutsById
   * */
  .get(auth('customer'), validate(payoutsValidation.getPayoutsById), payoutsController.getPayouts)
  /**
   * updatePayouts
   * */
  .put(auth('customer'), validate(payoutsValidation.updatePayouts), payoutsController.updatePayouts)
  /**
   * deletePayoutsById
   * */
  .delete(auth('customer'), validate(payoutsValidation.deletePayoutsById), payoutsController.removePayouts);
export default router;
