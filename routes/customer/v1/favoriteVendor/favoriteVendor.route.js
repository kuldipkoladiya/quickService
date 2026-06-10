import express from 'express';
import { favoriteVendorController } from 'controllers/customer';
import { favoriteVendorValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createFavoriteVendor
   * */
  .post(
    auth('customer'),
    validate(favoriteVendorValidation.createFavoriteVendor),
    favoriteVendorController.createFavoriteVendor
  )
  /**
   * getFavoriteVendor
   * */
  .get(auth('customer'), validate(favoriteVendorValidation.getFavoriteVendor), favoriteVendorController.listFavoriteVendor);
router
  .route('/paginated')
  /**
   * getFavoriteVendorPaginated
   * */
  .get(
    auth('customer'),
    validate(favoriteVendorValidation.paginatedFavoriteVendor),
    favoriteVendorController.paginateFavoriteVendor
  );
router
  .route('/:favoriteVendorId')
  /**
   * getFavoriteVendorById
   * */
  .get(
    auth('customer'),
    validate(favoriteVendorValidation.getFavoriteVendorById),
    favoriteVendorController.getFavoriteVendor
  )
  /**
   * updateFavoriteVendor
   * */
  .put(
    auth('customer'),
    validate(favoriteVendorValidation.updateFavoriteVendor),
    favoriteVendorController.updateFavoriteVendor
  )
  /**
   * deleteFavoriteVendorById
   * */
  .delete(
    auth('customer'),
    validate(favoriteVendorValidation.deleteFavoriteVendorById),
    favoriteVendorController.removeFavoriteVendor
  );
export default router;
