import express from 'express';
import { addressController } from 'controllers/admin';
import { addressValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createAddress
   * */
  .post(auth('admin'), validate(addressValidation.createAddress), addressController.createAddress)
  /**
   * getAddress
   * */
  .get(auth('admin'), validate(addressValidation.getAddress), addressController.listAddress);
router
  .route('/paginated')
  /**
   * getAddressPaginated
   * */
  .get(auth('admin'), validate(addressValidation.paginatedAddress), addressController.paginateAddress);
router
  .route('/:addressId')
  /**
   * getAddressById
   * */
  .get(auth('admin'), validate(addressValidation.getAddressById), addressController.getAddress)
  /**
   * updateAddress
   * */
  .put(auth('admin'), validate(addressValidation.updateAddress), addressController.updateAddress)
  /**
   * deleteAddressById
   * */
  .delete(auth('admin'), validate(addressValidation.deleteAddressById), addressController.removeAddress);
export default router;
