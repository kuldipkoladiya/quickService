import express from 'express';
import { walletController } from 'controllers/admin';
import { walletValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createWallet
   * */
  .post(auth('admin'), validate(walletValidation.createWallet), walletController.createWallet)
  /**
   * getWallet
   * */
  .get(auth('admin'), validate(walletValidation.getWallet), walletController.listWallet);
router
  .route('/paginated')
  /**
   * getWalletPaginated
   * */
  .get(auth('admin'), validate(walletValidation.paginatedWallet), walletController.paginateWallet);
router
  .route('/:walletId')
  /**
   * getWalletById
   * */
  .get(auth('admin'), validate(walletValidation.getWalletById), walletController.getWallet)
  /**
   * updateWallet
   * */
  .put(auth('admin'), validate(walletValidation.updateWallet), walletController.updateWallet)
  /**
   * deleteWalletById
   * */
  .delete(auth('admin'), validate(walletValidation.deleteWalletById), walletController.removeWallet);
export default router;
