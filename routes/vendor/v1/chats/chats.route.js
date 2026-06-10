import express from 'express';
import { chatsController } from 'controllers/vendor';
import { chatsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createChats
   * */
  .post(auth('vendor'), validate(chatsValidation.createChats), chatsController.createChats)
  /**
   * getChats
   * */
  .get(auth('vendor'), validate(chatsValidation.getChats), chatsController.listChats);
router
  .route('/paginated')
  /**
   * getChatsPaginated
   * */
  .get(auth('vendor'), validate(chatsValidation.paginatedChats), chatsController.paginateChats);
router
  .route('/:chatsId')
  /**
   * getChatsById
   * */
  .get(auth('vendor'), validate(chatsValidation.getChatsById), chatsController.getChats)
  /**
   * updateChats
   * */
  .put(auth('vendor'), validate(chatsValidation.updateChats), chatsController.updateChats)
  /**
   * deleteChatsById
   * */
  .delete(auth('vendor'), validate(chatsValidation.deleteChatsById), chatsController.removeChats);
export default router;
