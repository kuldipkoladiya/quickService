import express from 'express';
import { vendorServiceController } from 'controllers/customer';
import { vendorServiceValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorService
   * */
  .post(auth('customer'), validate(vendorServiceValidation.createVendorService), vendorServiceController.createVendorService)
  /**
   * getVendorService
   * */
  .get(auth('customer'), validate(vendorServiceValidation.getVendorService), vendorServiceController.listVendorService);
router
  .route('/paginated')
  /**
   * getVendorServicePaginated
   * */
  .get(
    auth('customer'),
    validate(vendorServiceValidation.paginatedVendorService),
    vendorServiceController.paginateVendorService
  );
router
  .route('/:vendorServiceId')
  /**
   * getVendorServiceById
   * */
  .get(auth('customer'), validate(vendorServiceValidation.getVendorServiceById), vendorServiceController.getVendorService)
  /**
   * updateVendorService
   * */
  .put(auth('customer'), validate(vendorServiceValidation.updateVendorService), vendorServiceController.updateVendorService)
  /**
   * deleteVendorServiceById
   * */
  .delete(
    auth('customer'),
    validate(vendorServiceValidation.deleteVendorServiceById),
    vendorServiceController.removeVendorService
  );
export default router;
