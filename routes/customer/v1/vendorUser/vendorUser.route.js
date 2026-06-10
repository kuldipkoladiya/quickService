import express from 'express';
import { vendorUserController } from 'controllers/customer';
import { vendorUserValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorUser
   * */
  .post(auth('customer'), validate(vendorUserValidation.createVendorUser), vendorUserController.createVendorUser)
  /**
   * getVendorUser
   * */
  .get(auth('customer'), validate(vendorUserValidation.getVendorUser), vendorUserController.listVendorUser);
router
  .route('/paginated')
  /**
   * getVendorUserPaginated
   * */
  .get(auth('customer'), validate(vendorUserValidation.paginatedVendorUser), vendorUserController.paginateVendorUser);
router
  .route('/:vendorUserId')
  /**
   * getVendorUserById
   * */
  .get(auth('customer'), validate(vendorUserValidation.getVendorUserById), vendorUserController.getVendorUser)
  /**
   * updateVendorUser
   * */
  .put(auth('customer'), validate(vendorUserValidation.updateVendorUser), vendorUserController.updateVendorUser)
  /**
   * deleteVendorUserById
   * */
  .delete(auth('customer'), validate(vendorUserValidation.deleteVendorUserById), vendorUserController.removeVendorUser);
export default router;
