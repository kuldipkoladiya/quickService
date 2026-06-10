import express from 'express';
import { vendorUserController } from 'controllers/admin';
import { vendorUserValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorUser
   * */
  .post(auth('admin'), validate(vendorUserValidation.createVendorUser), vendorUserController.createVendorUser)
  /**
   * getVendorUser
   * */
  .get(auth('admin'), validate(vendorUserValidation.getVendorUser), vendorUserController.listVendorUser);
router
  .route('/paginated')
  /**
   * getVendorUserPaginated
   * */
  .get(auth('admin'), validate(vendorUserValidation.paginatedVendorUser), vendorUserController.paginateVendorUser);
router
  .route('/:vendorUserId')
  /**
   * getVendorUserById
   * */
  .get(auth('admin'), validate(vendorUserValidation.getVendorUserById), vendorUserController.getVendorUser)
  /**
   * updateVendorUser
   * */
  .put(auth('admin'), validate(vendorUserValidation.updateVendorUser), vendorUserController.updateVendorUser)
  /**
   * deleteVendorUserById
   * */
  .delete(auth('admin'), validate(vendorUserValidation.deleteVendorUserById), vendorUserController.removeVendorUser);
export default router;
