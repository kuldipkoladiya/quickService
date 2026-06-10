import express from 'express';
import { servicesController } from 'controllers/vendor';
import { servicesValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createServices
   * */
  .post(auth('vendor'), validate(servicesValidation.createServices), servicesController.createServices)
  /**
   * getServices
   * */
  .get(auth('vendor'), validate(servicesValidation.getServices), servicesController.listServices);
router
  .route('/paginated')
  /**
   * getServicesPaginated
   * */
  .get(auth('vendor'), validate(servicesValidation.paginatedServices), servicesController.paginateServices);
router
  .route('/:servicesId')
  /**
   * getServicesById
   * */
  .get(auth('vendor'), validate(servicesValidation.getServicesById), servicesController.getServices)
  /**
   * updateServices
   * */
  .put(auth('vendor'), validate(servicesValidation.updateServices), servicesController.updateServices)
  /**
   * deleteServicesById
   * */
  .delete(auth('vendor'), validate(servicesValidation.deleteServicesById), servicesController.removeServices);
export default router;
