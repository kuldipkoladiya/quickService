import express from 'express';
import { bankController } from 'controllers/admin';
import { bankValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBank
   * */
  .post(auth('admin'), validate(bankValidation.createBank), bankController.createBank)
  /**
   * getBank
   * */
  .get(auth('admin'), validate(bankValidation.getBank), bankController.listBank);
router
  .route('/paginated')
  /**
   * getBankPaginated
   * */
  .get(auth('admin'), validate(bankValidation.paginatedBank), bankController.paginateBank);
router
  .route('/:bankId')
  /**
   * getBankById
   * */
  .get(auth('admin'), validate(bankValidation.getBankById), bankController.getBank)
  /**
   * updateBank
   * */
  .put(auth('admin'), validate(bankValidation.updateBank), bankController.updateBank)
  /**
   * deleteBankById
   * */
  .delete(auth('admin'), validate(bankValidation.deleteBankById), bankController.removeBank);
export default router;
