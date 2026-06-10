import express from 'express';
import { servicesController } from 'controllers/admin';
import { servicesValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createServices
   * */
  .post(auth('admin'), validate(servicesValidation.createServices), servicesController.createServices)
  /**
   * getServices
   * */
  .get(auth('admin'), validate(servicesValidation.getServices), servicesController.listServices);
router
  .route('/paginated')
  /**
   * getServicesPaginated
   * */
  .get(auth('admin'), validate(servicesValidation.paginatedServices), servicesController.paginateServices);
router
  .route('/:servicesId')
  /**
   * getServicesById
   * */
  .get(auth('admin'), validate(servicesValidation.getServicesById), servicesController.getServices)
  /**
   * updateServices
   * */
  .put(auth('admin'), validate(servicesValidation.updateServices), servicesController.updateServices)
  /**
   * deleteServicesById
   * */
  .delete(auth('admin'), validate(servicesValidation.deleteServicesById), servicesController.removeServices);
export default router;
