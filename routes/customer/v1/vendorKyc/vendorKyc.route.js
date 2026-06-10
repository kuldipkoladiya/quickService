import express from 'express';
import { vendorKycController } from 'controllers/customer';
import { vendorKycValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorKyc
   * */
  .post(auth('customer'), validate(vendorKycValidation.createVendorKyc), vendorKycController.createVendorKyc)
  /**
   * getVendorKyc
   * */
  .get(auth('customer'), validate(vendorKycValidation.getVendorKyc), vendorKycController.listVendorKyc);
router
  .route('/paginated')
  /**
   * getVendorKycPaginated
   * */
  .get(auth('customer'), validate(vendorKycValidation.paginatedVendorKyc), vendorKycController.paginateVendorKyc);
router
  .route('/:vendorKycId')
  /**
   * getVendorKycById
   * */
  .get(auth('customer'), validate(vendorKycValidation.getVendorKycById), vendorKycController.getVendorKyc)
  /**
   * updateVendorKyc
   * */
  .put(auth('customer'), validate(vendorKycValidation.updateVendorKyc), vendorKycController.updateVendorKyc)
  /**
   * deleteVendorKycById
   * */
  .delete(auth('customer'), validate(vendorKycValidation.deleteVendorKycById), vendorKycController.removeVendorKyc);
export default router;
