import express from 'express';
import { paymentsController } from 'controllers/vendor';
import { paymentsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createPayments
   * */
  .post(auth('vendor'), validate(paymentsValidation.createPayments), paymentsController.createPayments)
  /**
   * getPayments
   * */
  .get(auth('vendor'), validate(paymentsValidation.getPayments), paymentsController.listPayments);
router
  .route('/paginated')
  /**
   * getPaymentsPaginated
   * */
  .get(auth('vendor'), validate(paymentsValidation.paginatedPayments), paymentsController.paginatePayments);
router
  .route('/:paymentsId')
  /**
   * getPaymentsById
   * */
  .get(auth('vendor'), validate(paymentsValidation.getPaymentsById), paymentsController.getPayments)
  /**
   * updatePayments
   * */
  .put(auth('vendor'), validate(paymentsValidation.updatePayments), paymentsController.updatePayments)
  /**
   * deletePaymentsById
   * */
  .delete(auth('vendor'), validate(paymentsValidation.deletePaymentsById), paymentsController.removePayments);
export default router;
