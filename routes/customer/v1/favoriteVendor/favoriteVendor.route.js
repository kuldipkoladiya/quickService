import express from 'express';
import { favoriteVendorController } from 'controllers/customer';
import { favoriteVendorValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();

router
  .route('/')
  /**
   * createFavoriteVendor - Add vendor to favorites
   * */
  .post(
    auth('customer'),
    validate(favoriteVendorValidation.createFavoriteVendor),
    favoriteVendorController.createFavoriteVendor
  )
  /**
   * getFavoriteVendor - Get list of favorite vendors for authenticated customer
   * */
  .get(auth('customer'), validate(favoriteVendorValidation.getFavoriteVendor), favoriteVendorController.listFavoriteVendor)
  /**
   * removeFavoriteVendor - Remove favorite with vendorId in body
   * */
  .delete(auth('customer'), favoriteVendorController.removeFavoriteVendor);

router
  .route('/paginated')
  /**
   * getFavoriteVendorPaginated - Get paginated favorite vendors
   * */
  .get(
    auth('customer'),
    validate(favoriteVendorValidation.paginatedFavoriteVendor),
    favoriteVendorController.paginateFavoriteVendor
  );

router
  .route('/toggle')
  /**
   * toggleFavoriteVendor - Toggle vendor favorite status
   * */
  .post(
    auth('customer'),
    validate(favoriteVendorValidation.toggleFavoriteVendor),
    favoriteVendorController.toggleFavoriteVendor
  );

router
  .route('/check/:vendorId')
  /**
   * checkFavoriteVendor - Check if vendor is in favorites
   * */
  .get(
    auth('customer'),
    validate(favoriteVendorValidation.checkFavoriteVendor),
    favoriteVendorController.checkFavoriteVendor
  );

router
  .route('/vendor/:vendorId')
  /**
   * deleteFavoriteByVendorId - Remove vendor from favorites by vendor ID
   * */
  .delete(
    auth('customer'),
    validate(favoriteVendorValidation.deleteFavoriteByVendorId),
    favoriteVendorController.removeFavoriteByVendorId
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
   * deleteFavoriteVendorById - Remove favorite by favoriteVendorId (or vendorId fallback)
   * */
  .delete(
    auth('customer'),
    validate(favoriteVendorValidation.deleteFavoriteVendorById),
    favoriteVendorController.removeFavoriteVendor
  );

export default router;
