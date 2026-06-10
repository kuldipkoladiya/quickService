import express from 'express';
import { vendorServiceController } from 'controllers/admin';
import { vendorServiceValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorService
   * */
  .post(auth('admin'), validate(vendorServiceValidation.createVendorService), vendorServiceController.createVendorService)
  /**
   * getVendorService
   * */
  .get(auth('admin'), validate(vendorServiceValidation.getVendorService), vendorServiceController.listVendorService);
router
  .route('/paginated')
  /**
   * getVendorServicePaginated
   * */
  .get(
    auth('admin'),
    validate(vendorServiceValidation.paginatedVendorService),
    vendorServiceController.paginateVendorService
  );
router
  .route('/:vendorServiceId')
  /**
   * getVendorServiceById
   * */
  .get(auth('admin'), validate(vendorServiceValidation.getVendorServiceById), vendorServiceController.getVendorService)
  /**
   * updateVendorService
   * */
  .put(auth('admin'), validate(vendorServiceValidation.updateVendorService), vendorServiceController.updateVendorService)
  /**
   * deleteVendorServiceById
   * */
  .delete(
    auth('admin'),
    validate(vendorServiceValidation.deleteVendorServiceById),
    vendorServiceController.removeVendorService
  );
export default router;
