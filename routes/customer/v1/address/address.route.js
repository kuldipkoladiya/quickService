import express from 'express';
import { addressController } from 'controllers/customer';
import { addressValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createAddress
   * */
  .post(auth('customer'), validate(addressValidation.createAddress), addressController.createAddress)
  /**
   * getAddress
   * */
  .get(auth('customer'), validate(addressValidation.getAddress), addressController.listAddress);
router
  .route('/paginated')
  /**
   * getAddressPaginated
   * */
  .get(auth('customer'), validate(addressValidation.paginatedAddress), addressController.paginateAddress);
router
  .route('/:addressId')
  /**
   * getAddressById
   * */
  .get(auth('customer'), validate(addressValidation.getAddressById), addressController.getAddress)
  /**
   * updateAddress
   * */
  .put(auth('customer'), validate(addressValidation.updateAddress), addressController.updateAddress)
  /**
   * deleteAddressById
   * */
  .delete(auth('customer'), validate(addressValidation.deleteAddressById), addressController.removeAddress);
export default router;
