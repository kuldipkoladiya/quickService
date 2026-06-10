import express from 'express';
import { notificationsController } from 'controllers/admin';
import { notificationsValidation } from 'validations/admin';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createNotifications
   * */
  .post(auth('admin'), validate(notificationsValidation.createNotifications), notificationsController.createNotifications)
  /**
   * getNotifications
   * */
  .get(auth('admin'), validate(notificationsValidation.getNotifications), notificationsController.listNotifications);
router
  .route('/paginated')
  /**
   * getNotificationsPaginated
   * */
  .get(
    auth('admin'),
    validate(notificationsValidation.paginatedNotifications),
    notificationsController.paginateNotifications
  );
router
  .route('/:notificationsId')
  /**
   * getNotificationsById
   * */
  .get(auth('admin'), validate(notificationsValidation.getNotificationsById), notificationsController.getNotifications)
  /**
   * updateNotifications
   * */
  .put(auth('admin'), validate(notificationsValidation.updateNotifications), notificationsController.updateNotifications)
  /**
   * deleteNotificationsById
   * */
  .delete(
    auth('admin'),
    validate(notificationsValidation.deleteNotificationsById),
    notificationsController.removeNotifications
  );
export default router;
