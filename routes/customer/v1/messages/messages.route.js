import express from 'express';
import { messagesController } from 'controllers/customer';
import { messagesValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createMessages
   * */
  .post(auth('customer'), validate(messagesValidation.createMessages), messagesController.createMessages)
  /**
   * getMessages
   * */
  .get(auth('customer'), validate(messagesValidation.getMessages), messagesController.listMessages);
router
  .route('/paginated')
  /**
   * getMessagesPaginated
   * */
  .get(auth('customer'), validate(messagesValidation.paginatedMessages), messagesController.paginateMessages);
router
  .route('/:messagesId')
  /**
   * getMessagesById
   * */
  .get(auth('customer'), validate(messagesValidation.getMessagesById), messagesController.getMessages)
  /**
   * updateMessages
   * */
  .put(auth('customer'), validate(messagesValidation.updateMessages), messagesController.updateMessages)
  /**
   * deleteMessagesById
   * */
  .delete(auth('customer'), validate(messagesValidation.deleteMessagesById), messagesController.removeMessages);
export default router;
