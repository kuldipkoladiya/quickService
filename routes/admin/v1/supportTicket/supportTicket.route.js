import express from 'express';
import { supportTicketController } from 'controllers/admin';
import { supportTicketValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createSupportTicket
   * */
  .post(auth('admin'), validate(supportTicketValidation.createSupportTicket), supportTicketController.createSupportTicket)
  /**
   * getSupportTicket
   * */
  .get(auth('admin'), validate(supportTicketValidation.getSupportTicket), supportTicketController.listSupportTicket);
router
  .route('/paginated')
  /**
   * getSupportTicketPaginated
   * */
  .get(
    auth('admin'),
    validate(supportTicketValidation.paginatedSupportTicket),
    supportTicketController.paginateSupportTicket
  );
router
  .route('/:supportTicketId')
  /**
   * getSupportTicketById
   * */
  .get(auth('admin'), validate(supportTicketValidation.getSupportTicketById), supportTicketController.getSupportTicket)
  /**
   * updateSupportTicket
   * */
  .put(auth('admin'), validate(supportTicketValidation.updateSupportTicket), supportTicketController.updateSupportTicket)
  /**
   * deleteSupportTicketById
   * */
  .delete(
    auth('admin'),
    validate(supportTicketValidation.deleteSupportTicketById),
    supportTicketController.removeSupportTicket
  );
export default router;
