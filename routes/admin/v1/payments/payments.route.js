import express from 'express';
import { paymentsController } from 'controllers/admin';
import { paymentsValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createPayments
   * */
  .post(auth('admin'), validate(paymentsValidation.createPayments), paymentsController.createPayments)
  /**
   * getPayments
   * */
  .get(auth('admin'), validate(paymentsValidation.getPayments), paymentsController.listPayments);
router
  .route('/paginated')
  /**
   * getPaymentsPaginated
   * */
  .get(auth('admin'), validate(paymentsValidation.paginatedPayments), paymentsController.paginatePayments);
router
  .route('/:paymentsId')
  /**
   * getPaymentsById
   * */
  .get(auth('admin'), validate(paymentsValidation.getPaymentsById), paymentsController.getPayments)
  /**
   * updatePayments
   * */
  .put(auth('admin'), validate(paymentsValidation.updatePayments), paymentsController.updatePayments)
  /**
   * deletePaymentsById
   * */
  .delete(auth('admin'), validate(paymentsValidation.deletePaymentsById), paymentsController.removePayments);
export default router;
