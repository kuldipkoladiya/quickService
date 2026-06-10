import express from 'express';
import { userController } from 'controllers/customer';
import { userValidation } from 'validations/customer';
import validate from 'middlewares/validate';

const router = express.Router();
router
  .route('/')
  /**
   * createUser
   * */
  .post(validate(userValidation.createUser), userController.createUser)
  /**
   * getUser
   * */
  .get(validate(userValidation.getUser), userController.listUser);
router
  .route('/paginated')
  /**
   * getUserPaginated
   * */
  .get(validate(userValidation.paginatedUser), userController.paginateUser);
router
  .route('/:userId')
  /**
   * getUserById
   * */
  .get(validate(userValidation.getUserById), userController.getUser)
  /**
   * updateUser
   * */
  .put(validate(userValidation.updateUser), userController.updateUser)
  /**
   * deleteUserById
   * */
  .delete(validate(userValidation.deleteUserById), userController.removeUser);
export default router;
