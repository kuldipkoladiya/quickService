import express from 'express';
import { categoriesController } from 'controllers/admin';
import { categoriesValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createCategories
   * */
  .post(auth('admin'), validate(categoriesValidation.createCategories), categoriesController.createCategories)
  /**
   * getCategories
   * */
  .get(auth('admin'), validate(categoriesValidation.getCategories), categoriesController.listCategories);
router
  .route('/paginated')
  /**
   * getCategoriesPaginated
   * */
  .get(auth('admin'), validate(categoriesValidation.paginatedCategories), categoriesController.paginateCategories);
router
  .route('/:categoriesId')
  /**
   * getCategoriesById
   * */
  .get(auth('admin'), validate(categoriesValidation.getCategoriesById), categoriesController.getCategories)
  /**
   * updateCategories
   * */
  .put(auth('admin'), validate(categoriesValidation.updateCategories), categoriesController.updateCategories)
  /**
   * deleteCategoriesById
   * */
  .delete(auth('admin'), validate(categoriesValidation.deleteCategoriesById), categoriesController.removeCategories);
export default router;
