import express from 'express';
import { chatsController } from 'controllers/customer';
import { chatsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createChats
   * */
  .post(auth('customer'), validate(chatsValidation.createChats), chatsController.createChats)
  /**
   * getChats
   * */
  .get(auth('customer'), validate(chatsValidation.getChats), chatsController.listChats);
router
  .route('/paginated')
  /**
   * getChatsPaginated
   * */
  .get(auth('customer'), validate(chatsValidation.paginatedChats), chatsController.paginateChats);
router
  .route('/:chatsId')
  /**
   * getChatsById
   * */
  .get(auth('customer'), validate(chatsValidation.getChatsById), chatsController.getChats)
  /**
   * updateChats
   * */
  .put(auth('customer'), validate(chatsValidation.updateChats), chatsController.updateChats)
  /**
   * deleteChatsById
   * */
  .delete(auth('customer'), validate(chatsValidation.deleteChatsById), chatsController.removeChats);
export default router;
