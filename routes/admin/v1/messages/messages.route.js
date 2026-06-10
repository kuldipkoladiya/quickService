import express from 'express';
import { messagesController } from 'controllers/admin';
import { messagesValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createMessages
   * */
  .post(auth('admin'), validate(messagesValidation.createMessages), messagesController.createMessages)
  /**
   * getMessages
   * */
  .get(auth('admin'), validate(messagesValidation.getMessages), messagesController.listMessages);
router
  .route('/paginated')
  /**
   * getMessagesPaginated
   * */
  .get(auth('admin'), validate(messagesValidation.paginatedMessages), messagesController.paginateMessages);
router
  .route('/:messagesId')
  /**
   * getMessagesById
   * */
  .get(auth('admin'), validate(messagesValidation.getMessagesById), messagesController.getMessages)
  /**
   * updateMessages
   * */
  .put(auth('admin'), validate(messagesValidation.updateMessages), messagesController.updateMessages)
  /**
   * deleteMessagesById
   * */
  .delete(auth('admin'), validate(messagesValidation.deleteMessagesById), messagesController.removeMessages);
export default router;
