import express from 'express';
import { userController } from 'controllers/admin';
import { userValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUser
   * */
  .post(auth('admin'), validate(userValidation.createUser), userController.createUser)
  /**
   * getUser
   * */
  .get(auth('admin'), validate(userValidation.getUser), userController.listUser);
router
  .route('/paginated')
  /**
   * getUserPaginated
   * */
  .get(auth('admin'), validate(userValidation.paginatedUser), userController.paginateUser);
router
  .route('/:userId')
  /**
   * getUserById
   * */
  .get(auth('admin'), validate(userValidation.getUserById), userController.getUser)
  /**
   * updateUser
   * */
  .put(auth('admin'), validate(userValidation.updateUser), userController.updateUser)
  /**
   * deleteUserById
   * */
  .delete(auth('admin'), validate(userValidation.deleteUserById), userController.removeUser);
export default router;
