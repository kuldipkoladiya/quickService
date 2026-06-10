import express from 'express';
import { supportTicketController } from 'controllers/customer';
import { supportTicketValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createSupportTicket
   * */
  .post(auth('customer'), validate(supportTicketValidation.createSupportTicket), supportTicketController.createSupportTicket)
  /**
   * getSupportTicket
   * */
  .get(auth('customer'), validate(supportTicketValidation.getSupportTicket), supportTicketController.listSupportTicket);
router
  .route('/paginated')
  /**
   * getSupportTicketPaginated
   * */
  .get(
    auth('customer'),
    validate(supportTicketValidation.paginatedSupportTicket),
    supportTicketController.paginateSupportTicket
  );
router
  .route('/:supportTicketId')
  /**
   * getSupportTicketById
   * */
  .get(auth('customer'), validate(supportTicketValidation.getSupportTicketById), supportTicketController.getSupportTicket)
  /**
   * updateSupportTicket
   * */
  .put(auth('customer'), validate(supportTicketValidation.updateSupportTicket), supportTicketController.updateSupportTicket)
  /**
   * deleteSupportTicketById
   * */
  .delete(
    auth('customer'),
    validate(supportTicketValidation.deleteSupportTicketById),
    supportTicketController.removeSupportTicket
  );
export default router;
