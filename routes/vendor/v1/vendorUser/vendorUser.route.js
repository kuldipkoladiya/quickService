import express from 'express';
import { vendorUserController } from 'controllers/vendor';
import { vendorUserValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createVendorUser
   * */
  .post(auth('vendor'), validate(vendorUserValidation.createVendorUser), vendorUserController.createVendorUser)
  /**
   * getVendorUser
   * */
  .get(auth('vendor'), validate(vendorUserValidation.getVendorUser), vendorUserController.listVendorUser);
router
  .route('/paginated')
  /**
   * getVendorUserPaginated
   * */
  .get(auth('vendor'), validate(vendorUserValidation.paginatedVendorUser), vendorUserController.paginateVendorUser);

router
  .route('/update-profile')
  .put(auth('vendor'), validate(vendorUserValidation.updateProfile), vendorUserController.updateProfile);

router
  .route('/:vendorUserId')
  /**
   * getVendorUserById
   * */
  .get(auth('vendor'), validate(vendorUserValidation.getVendorUserById), vendorUserController.getVendorUser)
  /**
   * updateVendorUser
   * */
  .put(auth('vendor'), validate(vendorUserValidation.updateVendorUser), vendorUserController.updateVendorUser)
  /**
   * deleteVendorUserById
   * */
  .delete(auth('vendor'), validate(vendorUserValidation.deleteVendorUserById), vendorUserController.removeVendorUser);
export default router;
