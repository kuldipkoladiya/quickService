import express from 'express';
import { userController } from 'controllers/vendor';
import { userValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createUser
   * */
  .post(auth('vendor'), validate(userValidation.createUser), userController.createUser)
  /**
   * getUser
   * */
  .get(auth('vendor'), validate(userValidation.getUser), userController.listUser);
router
  .route('/paginated')
  /**
   * getUserPaginated
   * */
  .get(auth('vendor'), validate(userValidation.paginatedUser), userController.paginateUser);
router
  .route('/:userId')
  /**
   * getUserById
   * */
  .get(auth('vendor'), validate(userValidation.getUserById), userController.getUser)
  /**
   * updateUser
   * */
  .put(auth('vendor'), validate(userValidation.updateUser), userController.updateUser)
  /**
   * deleteUserById
   * */
  .delete(auth('vendor'), validate(userValidation.deleteUserById), userController.removeUser);
export default router;
