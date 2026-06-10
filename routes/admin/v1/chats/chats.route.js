import express from 'express';
import { chatsController } from 'controllers/admin';
import { chatsValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createChats
   * */
  .post(auth('admin'), validate(chatsValidation.createChats), chatsController.createChats)
  /**
   * getChats
   * */
  .get(auth('admin'), validate(chatsValidation.getChats), chatsController.listChats);
router
  .route('/paginated')
  /**
   * getChatsPaginated
   * */
  .get(auth('admin'), validate(chatsValidation.paginatedChats), chatsController.paginateChats);
router
  .route('/:chatsId')
  /**
   * getChatsById
   * */
  .get(auth('admin'), validate(chatsValidation.getChatsById), chatsController.getChats)
  /**
   * updateChats
   * */
  .put(auth('admin'), validate(chatsValidation.updateChats), chatsController.updateChats)
  /**
   * deleteChatsById
   * */
  .delete(auth('admin'), validate(chatsValidation.deleteChatsById), chatsController.removeChats);
export default router;
