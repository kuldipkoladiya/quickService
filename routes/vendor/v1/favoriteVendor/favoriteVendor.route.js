import express from 'express';
import { favoriteVendorController } from 'controllers/vendor';
import { favoriteVendorValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createFavoriteVendor
   * */
  .post(
    auth('vendor'),
    validate(favoriteVendorValidation.createFavoriteVendor),
    favoriteVendorController.createFavoriteVendor
  )
  /**
   * getFavoriteVendor
   * */
  .get(auth('vendor'), validate(favoriteVendorValidation.getFavoriteVendor), favoriteVendorController.listFavoriteVendor);
router
  .route('/paginated')
  /**
   * getFavoriteVendorPaginated
   * */
  .get(
    auth('vendor'),
    validate(favoriteVendorValidation.paginatedFavoriteVendor),
    favoriteVendorController.paginateFavoriteVendor
  );
router
  .route('/:favoriteVendorId')
  /**
   * getFavoriteVendorById
   * */
  .get(auth('vendor'), validate(favoriteVendorValidation.getFavoriteVendorById), favoriteVendorController.getFavoriteVendor)
  /**
   * updateFavoriteVendor
   * */
  .put(
    auth('vendor'),
    validate(favoriteVendorValidation.updateFavoriteVendor),
    favoriteVendorController.updateFavoriteVendor
  )
  /**
   * deleteFavoriteVendorById
   * */
  .delete(
    auth('vendor'),
    validate(favoriteVendorValidation.deleteFavoriteVendorById),
    favoriteVendorController.removeFavoriteVendor
  );
export default router;
