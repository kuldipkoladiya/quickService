import express from 'express';
import { supportTicketController } from 'controllers/vendor';
import { supportTicketValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createSupportTicket
   * */
  .post(auth('vendor'), validate(supportTicketValidation.createSupportTicket), supportTicketController.createSupportTicket)
  /**
   * getSupportTicket
   * */
  .get(auth('vendor'), validate(supportTicketValidation.getSupportTicket), supportTicketController.listSupportTicket);
router
  .route('/paginated')
  /**
   * getSupportTicketPaginated
   * */
  .get(
    auth('vendor'),
    validate(supportTicketValidation.paginatedSupportTicket),
    supportTicketController.paginateSupportTicket
  );
router
  .route('/:supportTicketId')
  /**
   * getSupportTicketById
   * */
  .get(auth('vendor'), validate(supportTicketValidation.getSupportTicketById), supportTicketController.getSupportTicket)
  /**
   * updateSupportTicket
   * */
  .put(auth('vendor'), validate(supportTicketValidation.updateSupportTicket), supportTicketController.updateSupportTicket)
  /**
   * deleteSupportTicketById
   * */
  .delete(
    auth('vendor'),
    validate(supportTicketValidation.deleteSupportTicketById),
    supportTicketController.removeSupportTicket
  );
export default router;
