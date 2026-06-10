import express from 'express';
import { payoutsController } from 'controllers/vendor';
import { payoutsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createPayouts
   * */
  .post(auth('vendor'), validate(payoutsValidation.createPayouts), payoutsController.createPayouts)
  /**
   * getPayouts
   * */
  .get(auth('vendor'), validate(payoutsValidation.getPayouts), payoutsController.listPayouts);
router
  .route('/paginated')
  /**
   * getPayoutsPaginated
   * */
  .get(auth('vendor'), validate(payoutsValidation.paginatedPayouts), payoutsController.paginatePayouts);
router
  .route('/:payoutsId')
  /**
   * getPayoutsById
   * */
  .get(auth('vendor'), validate(payoutsValidation.getPayoutsById), payoutsController.getPayouts)
  /**
   * updatePayouts
   * */
  .put(auth('vendor'), validate(payoutsValidation.updatePayouts), payoutsController.updatePayouts)
  /**
   * deletePayoutsById
   * */
  .delete(auth('vendor'), validate(payoutsValidation.deletePayoutsById), payoutsController.removePayouts);
export default router;
