import express from 'express';
import { vendorKycController } from 'controllers/admin';
import { vendorKycValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorKyc
   * */
  .post(auth('admin'), validate(vendorKycValidation.createVendorKyc), vendorKycController.createVendorKyc)
  /**
   * getVendorKyc
   * */
  .get(auth('admin'), validate(vendorKycValidation.getVendorKyc), vendorKycController.listVendorKyc);
router
  .route('/paginated')
  /**
   * getVendorKycPaginated
   * */
  .get(auth('admin'), validate(vendorKycValidation.paginatedVendorKyc), vendorKycController.paginateVendorKyc);
router
  .route('/:vendorKycId')
  /**
   * getVendorKycById
   * */
  .get(auth('admin'), validate(vendorKycValidation.getVendorKycById), vendorKycController.getVendorKyc)
  /**
   * updateVendorKyc
   * */
  .put(auth('admin'), validate(vendorKycValidation.updateVendorKyc), vendorKycController.updateVendorKyc)
  /**
   * deleteVendorKycById
   * */
  .delete(auth('admin'), validate(vendorKycValidation.deleteVendorKycById), vendorKycController.removeVendorKyc);
export default router;
