import express from 'express';
import { walletController } from 'controllers/customer';
import { walletValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createWallet
   * */
  .post(auth('customer'), validate(walletValidation.createWallet), walletController.createWallet)
  /**
   * getWallet
   * */
  .get(auth('customer'), validate(walletValidation.getWallet), walletController.listWallet);
router
  .route('/paginated')
  /**
   * getWalletPaginated
   * */
  .get(auth('customer'), validate(walletValidation.paginatedWallet), walletController.paginateWallet);
router
  .route('/:walletId')
  /**
   * getWalletById
   * */
  .get(auth('customer'), validate(walletValidation.getWalletById), walletController.getWallet)
  /**
   * updateWallet
   * */
  .put(auth('customer'), validate(walletValidation.updateWallet), walletController.updateWallet)
  /**
   * deleteWalletById
   * */
  .delete(auth('customer'), validate(walletValidation.deleteWalletById), walletController.removeWallet);
export default router;
