import express from 'express';
import { addressController } from 'controllers/vendor';
import { addressValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createAddress
   * */
  .post(auth('vendor'), validate(addressValidation.createAddress), addressController.createAddress)
  /**
   * getAddress
   * */
  .get(auth('vendor'), validate(addressValidation.getAddress), addressController.listAddress);
router
  .route('/paginated')
  /**
   * getAddressPaginated
   * */
  .get(auth('vendor'), validate(addressValidation.paginatedAddress), addressController.paginateAddress);
router
  .route('/:addressId')
  /**
   * getAddressById
   * */
  .get(auth('vendor'), validate(addressValidation.getAddressById), addressController.getAddress)
  /**
   * updateAddress
   * */
  .put(auth('vendor'), validate(addressValidation.updateAddress), addressController.updateAddress)
  /**
   * deleteAddressById
   * */
  .delete(auth('vendor'), validate(addressValidation.deleteAddressById), addressController.removeAddress);
export default router;
