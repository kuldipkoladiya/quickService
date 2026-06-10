import express from 'express';
import { favoriteVendorController } from 'controllers/admin';
import { favoriteVendorValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createFavoriteVendor
   * */
  .post(
    auth('admin'),
    validate(favoriteVendorValidation.createFavoriteVendor),
    favoriteVendorController.createFavoriteVendor
  )
  /**
   * getFavoriteVendor
   * */
  .get(auth('admin'), validate(favoriteVendorValidation.getFavoriteVendor), favoriteVendorController.listFavoriteVendor);
router
  .route('/paginated')
  /**
   * getFavoriteVendorPaginated
   * */
  .get(
    auth('admin'),
    validate(favoriteVendorValidation.paginatedFavoriteVendor),
    favoriteVendorController.paginateFavoriteVendor
  );
router
  .route('/:favoriteVendorId')
  /**
   * getFavoriteVendorById
   * */
  .get(auth('admin'), validate(favoriteVendorValidation.getFavoriteVendorById), favoriteVendorController.getFavoriteVendor)
  /**
   * updateFavoriteVendor
   * */
  .put(auth('admin'), validate(favoriteVendorValidation.updateFavoriteVendor), favoriteVendorController.updateFavoriteVendor)
  /**
   * deleteFavoriteVendorById
   * */
  .delete(
    auth('admin'),
    validate(favoriteVendorValidation.deleteFavoriteVendorById),
    favoriteVendorController.removeFavoriteVendor
  );
export default router;
