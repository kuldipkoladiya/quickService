import express from 'express';
import { vendorAvailabilityController } from 'controllers/admin';
import { vendorAvailabilityValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorAvailability
   * */
  .post(
    auth('admin'),
    validate(vendorAvailabilityValidation.createVendorAvailability),
    vendorAvailabilityController.createVendorAvailability
  )
  /**
   * getVendorAvailability
   * */
  .get(
    auth('admin'),
    validate(vendorAvailabilityValidation.getVendorAvailability),
    vendorAvailabilityController.listVendorAvailability
  );
router
  .route('/paginated')
  /**
   * getVendorAvailabilityPaginated
   * */
  .get(
    auth('admin'),
    validate(vendorAvailabilityValidation.paginatedVendorAvailability),
    vendorAvailabilityController.paginateVendorAvailability
  );
router
  .route('/:vendorAvailabilityId')
  /**
   * getVendorAvailabilityById
   * */
  .get(
    auth('admin'),
    validate(vendorAvailabilityValidation.getVendorAvailabilityById),
    vendorAvailabilityController.getVendorAvailability
  )
  /**
   * updateVendorAvailability
   * */
  .put(
    auth('admin'),
    validate(vendorAvailabilityValidation.updateVendorAvailability),
    vendorAvailabilityController.updateVendorAvailability
  )
  /**
   * deleteVendorAvailabilityById
   * */
  .delete(
    auth('admin'),
    validate(vendorAvailabilityValidation.deleteVendorAvailabilityById),
    vendorAvailabilityController.removeVendorAvailability
  );
export default router;
