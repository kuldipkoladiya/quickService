import express from 'express';
import { messagesController } from 'controllers/vendor';
import { messagesValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createMessages
   * */
  .post(auth('vendor'), validate(messagesValidation.createMessages), messagesController.createMessages)
  /**
   * getMessages
   * */
  .get(auth('vendor'), validate(messagesValidation.getMessages), messagesController.listMessages);
router
  .route('/paginated')
  /**
   * getMessagesPaginated
   * */
  .get(auth('vendor'), validate(messagesValidation.paginatedMessages), messagesController.paginateMessages);
router
  .route('/:messagesId')
  /**
   * getMessagesById
   * */
  .get(auth('vendor'), validate(messagesValidation.getMessagesById), messagesController.getMessages)
  /**
   * updateMessages
   * */
  .put(auth('vendor'), validate(messagesValidation.updateMessages), messagesController.updateMessages)
  /**
   * deleteMessagesById
   * */
  .delete(auth('vendor'), validate(messagesValidation.deleteMessagesById), messagesController.removeMessages);
export default router;
