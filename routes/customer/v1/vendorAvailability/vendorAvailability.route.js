import express from 'express';
import { vendorAvailabilityController } from 'controllers/customer';
import { vendorAvailabilityValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorAvailability
   * */
  .post(
    auth('customer'),
    validate(vendorAvailabilityValidation.createVendorAvailability),
    vendorAvailabilityController.createVendorAvailability
  )
  /**
   * getVendorAvailability
   * */
  .get(
    auth('customer'),
    validate(vendorAvailabilityValidation.getVendorAvailability),
    vendorAvailabilityController.listVendorAvailability
  );
router
  .route('/slots/:vendorId')
  /**
   * getVendorSlots
   * */
  .get(auth('customer'), validate(vendorAvailabilityValidation.getVendorSlots), vendorAvailabilityController.getVendorSlots);

router
  .route('/vendor/:vendorId')
  /**
   * getVendorAvailabilityByVendorId
   * */
  .get(
    auth('customer'),
    validate(vendorAvailabilityValidation.getVendorAvailabilityByVendorId),
    vendorAvailabilityController.getVendorAvailabilityByVendorId
  );

router
  .route('/paginated')
  /**
   * getVendorAvailabilityPaginated
   * */
  .get(
    auth('customer'),
    validate(vendorAvailabilityValidation.paginatedVendorAvailability),
    vendorAvailabilityController.paginateVendorAvailability
  );
router
  .route('/:vendorAvailabilityId')
  /**
   * getVendorAvailabilityById
   * */
  .get(
    auth('customer'),
    validate(vendorAvailabilityValidation.getVendorAvailabilityById),
    vendorAvailabilityController.getVendorAvailability
  )
  /**
   * updateVendorAvailability
   * */
  .put(
    auth('customer'),
    validate(vendorAvailabilityValidation.updateVendorAvailability),
    vendorAvailabilityController.updateVendorAvailability
  )
  /**
   * deleteVendorAvailabilityById
   * */
  .delete(
    auth('customer'),
    validate(vendorAvailabilityValidation.deleteVendorAvailabilityById),
    vendorAvailabilityController.removeVendorAvailability
  );
export default router;
