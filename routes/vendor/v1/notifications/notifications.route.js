import express from 'express';
import { notificationsController } from 'controllers/vendor';
import { notificationsValidation } from 'validations/vendor';
import validate from 'middlewares/validate';
import auth from 'middlewares/auth';

const router = express.Router();
router
  .route('/')
  /**
   * createNotifications
   * */
  .post(auth('vendor'), validate(notificationsValidation.createNotifications), notificationsController.createNotifications)
  /**
   * getNotifications
   * */
  .get(auth('vendor'), validate(notificationsValidation.getNotifications), notificationsController.listNotifications);
router
  .route('/paginated')
  /**
   * getNotificationsPaginated
   * */
  .get(
    auth('vendor'),
    validate(notificationsValidation.paginatedNotifications),
    notificationsController.paginateNotifications
  );
router
  .route('/:notificationsId')
  /**
   * getNotificationsById
   * */
  .get(auth('vendor'), validate(notificationsValidation.getNotificationsById), notificationsController.getNotifications)
  /**
   * updateNotifications
   * */
  .put(auth('vendor'), validate(notificationsValidation.updateNotifications), notificationsController.updateNotifications)
  /**
   * deleteNotificationsById
   * */
  .delete(
    auth('vendor'),
    validate(notificationsValidation.deleteNotificationsById),
    notificationsController.removeNotifications
  );
export default router;
