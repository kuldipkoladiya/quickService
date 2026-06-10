import express from 'express';
import { vendorKycController } from 'controllers/vendor';
import { vendorKycValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorKyc
   * */
  .post(auth('vendor'), validate(vendorKycValidation.createVendorKyc), vendorKycController.createVendorKyc)
  /**
   * getVendorKyc
   * */
  .get(auth('vendor'), validate(vendorKycValidation.getVendorKyc), vendorKycController.listVendorKyc);
router
  .route('/paginated')
  /**
   * getVendorKycPaginated
   * */
  .get(auth('vendor'), validate(vendorKycValidation.paginatedVendorKyc), vendorKycController.paginateVendorKyc);
router
  .route('/:vendorKycId')
  /**
   * getVendorKycById
   * */
  .get(auth('vendor'), validate(vendorKycValidation.getVendorKycById), vendorKycController.getVendorKyc)
  /**
   * updateVendorKyc
   * */
  .put(auth('vendor'), validate(vendorKycValidation.updateVendorKyc), vendorKycController.updateVendorKyc)
  /**
   * deleteVendorKycById
   * */
  .delete(auth('vendor'), validate(vendorKycValidation.deleteVendorKycById), vendorKycController.removeVendorKyc);
export default router;
