import express from 'express';
import { walletController } from 'controllers/vendor';
import { walletValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createWallet
   * */
  .post(auth('vendor'), validate(walletValidation.createWallet), walletController.createWallet)
  /**
   * getWallet
   * */
  .get(auth('vendor'), validate(walletValidation.getWallet), walletController.listWallet);
router
  .route('/paginated')
  /**
   * getWalletPaginated
   * */
  .get(auth('vendor'), validate(walletValidation.paginatedWallet), walletController.paginateWallet);
router
  .route('/:walletId')
  /**
   * getWalletById
   * */
  .get(auth('vendor'), validate(walletValidation.getWalletById), walletController.getWallet)
  /**
   * updateWallet
   * */
  .put(auth('vendor'), validate(walletValidation.updateWallet), walletController.updateWallet)
  /**
   * deleteWalletById
   * */
  .delete(auth('vendor'), validate(walletValidation.deleteWalletById), walletController.removeWallet);
export default router;
