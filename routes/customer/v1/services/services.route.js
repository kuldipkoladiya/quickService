import express from 'express';
import { servicesController } from 'controllers/customer';
import { servicesValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createServices
   * */
  .post(auth('customer'), validate(servicesValidation.createServices), servicesController.createServices)
  /**
   * getServices
   * */
  .get(auth('customer'), validate(servicesValidation.getServices), servicesController.listServices);
router
  .route('/paginated')
  /**
   * getServicesPaginated
   * */
  .get(auth('customer'), validate(servicesValidation.paginatedServices), servicesController.paginateServices);
router
  .route('/:servicesId')
  /**
   * getServicesById
   * */
  .get(auth('customer'), validate(servicesValidation.getServicesById), servicesController.getServices)
  /**
   * updateServices
   * */
  .put(auth('customer'), validate(servicesValidation.updateServices), servicesController.updateServices)
  /**
   * deleteServicesById
   * */
  .delete(auth('customer'), validate(servicesValidation.deleteServicesById), servicesController.removeServices);
export default router;
