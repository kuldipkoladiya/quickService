import express from 'express';
import { notificationsController } from 'controllers/customer';
import { notificationsValidation } from 'validations/customer';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createNotifications
   * */
  .post(auth('customer'), validate(notificationsValidation.createNotifications), notificationsController.createNotifications)
  /**
   * getNotifications
   * */
  .get(auth('customer'), validate(notificationsValidation.getNotifications), notificationsController.listNotifications);
router
  .route('/paginated')
  /**
   * getNotificationsPaginated
   * */
  .get(
    auth('customer'),
    validate(notificationsValidation.paginatedNotifications),
    notificationsController.paginateNotifications
  );
router
  .route('/:notificationsId')
  /**
   * getNotificationsById
   * */
  .get(auth('customer'), validate(notificationsValidation.getNotificationsById), notificationsController.getNotifications)
  /**
   * updateNotifications
   * */
  .put(auth('customer'), validate(notificationsValidation.updateNotifications), notificationsController.updateNotifications)
  /**
   * deleteNotificationsById
   * */
  .delete(
    auth('customer'),
    validate(notificationsValidation.deleteNotificationsById),
    notificationsController.removeNotifications
  );
export default router;
