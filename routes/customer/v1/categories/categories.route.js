import express from 'express';
import { categoriesController } from 'controllers/customer';
import { categoriesValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createCategories
   * */
  .post(auth('customer'), validate(categoriesValidation.createCategories), categoriesController.createCategories)
  /**
   * getCategories
   * */
  .get(auth('customer'), validate(categoriesValidation.getCategories), categoriesController.listCategories);
router
  .route('/paginated')
  /**
   * getCategoriesPaginated
   * */
  .get(auth('customer'), validate(categoriesValidation.paginatedCategories), categoriesController.paginateCategories);
router
  .route('/:categoriesId')
  /**
   * getCategoriesById
   * */
  .get(auth('customer'), validate(categoriesValidation.getCategoriesById), categoriesController.getCategories)
  /**
   * updateCategories
   * */
  .put(auth('customer'), validate(categoriesValidation.updateCategories), categoriesController.updateCategories)
  /**
   * deleteCategoriesById
   * */
  .delete(auth('customer'), validate(categoriesValidation.deleteCategoriesById), categoriesController.removeCategories);
export default router;
