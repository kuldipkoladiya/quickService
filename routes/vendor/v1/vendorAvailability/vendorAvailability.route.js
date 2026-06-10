import express from 'express';
import { vendorAvailabilityController } from 'controllers/vendor';
import { vendorAvailabilityValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorAvailability
   * */
  .post(
    auth('vendor'),
    validate(vendorAvailabilityValidation.createVendorAvailability),
    vendorAvailabilityController.createVendorAvailability
  )
  /**
   * getVendorAvailability
   * */
  .get(
    auth('vendor'),
    validate(vendorAvailabilityValidation.getVendorAvailability),
    vendorAvailabilityController.listVendorAvailability
  );
router
  .route('/paginated')
  /**
   * getVendorAvailabilityPaginated
   * */
  .get(
    auth('vendor'),
    validate(vendorAvailabilityValidation.paginatedVendorAvailability),
    vendorAvailabilityController.paginateVendorAvailability
  );
router
  .route('/:vendorAvailabilityId')
  /**
   * getVendorAvailabilityById
   * */
  .get(
    auth('vendor'),
    validate(vendorAvailabilityValidation.getVendorAvailabilityById),
    vendorAvailabilityController.getVendorAvailability
  )
  /**
   * updateVendorAvailability
   * */
  .put(
    auth('vendor'),
    validate(vendorAvailabilityValidation.updateVendorAvailability),
    vendorAvailabilityController.updateVendorAvailability
  )
  /**
   * deleteVendorAvailabilityById
   * */
  .delete(
    auth('vendor'),
    validate(vendorAvailabilityValidation.deleteVendorAvailabilityById),
    vendorAvailabilityController.removeVendorAvailability
  );
export default router;
