import express from 'express';
import { paymentsController } from 'controllers/customer';
import { paymentsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createPayments
   * */
  .post(auth('customer'), validate(paymentsValidation.createPayments), paymentsController.createPayments)
  /**
   * getPayments
   * */
  .get(auth('customer'), validate(paymentsValidation.getPayments), paymentsController.listPayments);
router
  .route('/paginated')
  /**
   * getPaymentsPaginated
   * */
  .get(auth('customer'), validate(paymentsValidation.paginatedPayments), paymentsController.paginatePayments);
router
  .route('/:paymentsId')
  /**
   * getPaymentsById
   * */
  .get(auth('customer'), validate(paymentsValidation.getPaymentsById), paymentsController.getPayments)
  /**
   * updatePayments
   * */
  .put(auth('customer'), validate(paymentsValidation.updatePayments), paymentsController.updatePayments)
  /**
   * deletePaymentsById
   * */
  .delete(auth('customer'), validate(paymentsValidation.deletePaymentsById), paymentsController.removePayments);
export default router;
