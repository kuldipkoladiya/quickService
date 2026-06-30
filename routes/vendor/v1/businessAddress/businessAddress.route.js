import express from 'express';
import { businessAddressController } from 'controllers/vendor';
import { businessAddressValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createBusinessAddress
   * */
  .post(auth('vendor'), validate(businessAddressValidation.createBusinessAddress), businessAddressController.createAddress)
  /**
   * getBusinessAddress
   * */
  .get(auth('vendor'), validate(businessAddressValidation.getBusinessAddress), businessAddressController.listAddress);

router
  .route('/paginated')
  /**
   * getBusinessAddressPaginated
   * */
  .get(
    auth('vendor'),
    validate(businessAddressValidation.paginatedBusinessAddress),
    businessAddressController.paginateAddress
  );

router
  .route('/:businessAddressId')
  /**
   * getBusinessAddressById
   * */
  .get(auth('vendor'), validate(businessAddressValidation.getBusinessAddressById), businessAddressController.getAddress)
  /**
   * updateBusinessAddress
   * */
  .put(auth('vendor'), validate(businessAddressValidation.updateBusinessAddress), businessAddressController.updateAddress)
  /**
   * deleteBusinessAddressById
   * */
  .delete(
    auth('vendor'),
    validate(businessAddressValidation.deleteBusinessAddressById),
    businessAddressController.removeAddress
  );

export default router;
