import express from 'express';
import { vendorServiceController } from 'controllers/vendor';
import { vendorServiceValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorService
   * */
  .post(auth('vendor'), validate(vendorServiceValidation.createVendorService), vendorServiceController.createVendorService)
  /**
   * getVendorService
   * */
  .get(auth('vendor'), validate(vendorServiceValidation.getVendorService), vendorServiceController.listVendorService);
router
  .route('/paginated')
  /**
   * getVendorServicePaginated
   * */
  .get(
    auth('vendor'),
    validate(vendorServiceValidation.paginatedVendorService),
    vendorServiceController.paginateVendorService
  );
router
  .route('/:vendorServiceId')
  /**
   * getVendorServiceById
   * */
  .get(auth('vendor'), validate(vendorServiceValidation.getVendorServiceById), vendorServiceController.getVendorService)
  /**
   * updateVendorService
   * */
  .put(auth('vendor'), validate(vendorServiceValidation.updateVendorService), vendorServiceController.updateVendorService)
  /**
   * deleteVendorServiceById
   * */
  .delete(
    auth('vendor'),
    validate(vendorServiceValidation.deleteVendorServiceById),
    vendorServiceController.removeVendorService
  );
export default router;
