import express from 'express';
import { bankController } from 'controllers/vendor';
import { bankValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBank
   * */
  .post(auth('vendor'), validate(bankValidation.createBank), bankController.createBank)
  /**
   * getBank
   * */
  .get(auth('vendor'), validate(bankValidation.getBank), bankController.listBank);
router
  .route('/paginated')
  /**
   * getBankPaginated
   * */
  .get(auth('vendor'), validate(bankValidation.paginatedBank), bankController.paginateBank);
router
  .route('/:bankId')
  /**
   * getBankById
   * */
  .get(auth('vendor'), validate(bankValidation.getBankById), bankController.getBank)
  /**
   * updateBank
   * */
  .put(auth('vendor'), validate(bankValidation.updateBank), bankController.updateBank)
  /**
   * deleteBankById
   * */
  .delete(auth('vendor'), validate(bankValidation.deleteBankById), bankController.removeBank);
export default router;
