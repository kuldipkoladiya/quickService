import express from 'express';
import { categoriesController } from 'controllers/vendor';
import { categoriesValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createCategories
   * */
  .post(auth('vendor'), validate(categoriesValidation.createCategories), categoriesController.createCategories)
  /**
   * getCategories
   * */
  .get(auth('vendor'), validate(categoriesValidation.getCategories), categoriesController.listCategories);
router
  .route('/paginated')
  /**
   * getCategoriesPaginated
   * */
  .get(auth('vendor'), validate(categoriesValidation.paginatedCategories), categoriesController.paginateCategories);
router
  .route('/:categoriesId')
  /**
   * getCategoriesById
   * */
  .get(auth('vendor'), validate(categoriesValidation.getCategoriesById), categoriesController.getCategories)
  /**
   * updateCategories
   * */
  .put(auth('vendor'), validate(categoriesValidation.updateCategories), categoriesController.updateCategories)
  /**
   * deleteCategoriesById
   * */
  .delete(auth('vendor'), validate(categoriesValidation.deleteCategoriesById), categoriesController.removeCategories);
export default router;
