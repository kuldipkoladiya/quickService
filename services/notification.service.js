import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';
import { User, VendorUser, Notifications } from 'models';
import { EnumNotificationType } from 'models/enum.model';

let isFirebaseInitialized = false;
let messaging = null;

try {
  let serviceAccount = null;

  // 1. Check environment variable FIREBASE_SERVICE_ACCOUNT_JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch (e) {
      console.error('[Firebase] Failed to parse process.env.FIREBASE_SERVICE_ACCOUNT_JSON:', e.message);
    }
  }

  // 2. Check multiple file paths for firebase.json
  if (!serviceAccount) {
    const possiblePaths = [
      path.resolve(process.cwd(), 'config/firebase.json'),
      path.resolve(process.cwd(), 'build/config/firebase.json'),
      path.join(__dirname, '../config/firebase.json'),
      path.join(__dirname, '../../config/firebase.json'),
    ];

    const foundPath = possiblePaths.find((p) => fs.existsSync(p));
    if (foundPath) {
      try {
        const fileContent = fs.readFileSync(foundPath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
      } catch (err) {
        console.error(`[Firebase] Failed reading ${foundPath}:`, err.message);
      }
    }
  }

  if (
    serviceAccount &&
    serviceAccount.project_id &&
    serviceAccount.private_key &&
    !serviceAccount.project_id.includes('sample-project') &&
    !serviceAccount.project_id.includes('your-project-id')
  ) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
    messaging = admin.messaging();
    isFirebaseInitialized = true;
    console.log(`[Firebase] Push notification service initialized successfully for project: ${serviceAccount.project_id}`);
  } else {
    console.warn(
      '[Firebase] Warning: Valid firebase.json service account key not found on server or using placeholder. Push notifications are in mock mode.'
    );
  }
} catch (error) {
  console.error('[Firebase] Failed to initialize Firebase Admin SDK:', error.message);
}

/**
 * Resolve User ID (if a VendorUser ID was passed, find its underlying User ID)
 * @param {string|ObjectId|Object} idOrUser
 * @returns {Promise<string|ObjectId>}
 */
export const resolveUserId = async (idOrUser) => {
  if (!idOrUser) return null;
  if (typeof idOrUser === 'object') {
    if (idOrUser.userId) return idOrUser.userId;
    if (idOrUser._id) return idOrUser._id;
  }
  try {
    const vendorUser = await VendorUser.findById(idOrUser).select('userId');
    if (vendorUser && vendorUser.userId) {
      return vendorUser.userId;
    }
  } catch (e) {
    // Not an ObjectId or not found
  }
  return idOrUser;
};

/**
 * Verify if an FCM Token format is valid or test via dry run
 * @param {string} fcmToken
 * @returns {Promise<boolean>}
 */
export const verifyFCMToken = async (fcmToken) => {
  if (!fcmToken || typeof fcmToken !== 'string' || fcmToken.trim().length < 10) {
    return false;
  }

  if (!isFirebaseInitialized || !messaging) {
    return true;
  }

  try {
    await messaging.send(
      {
        token: fcmToken,
      },
      true // Dry run
    );
    return true;
  } catch (error) {
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      return false;
    }
    return true;
  }
};

/**
 * Clean up invalid / unregistered tokens from MongoDB
 * @param {Array<string>} badTokens
 */
export const cleanInvalidDeviceTokens = async (badTokens = []) => {
  if (!badTokens || !badTokens.length) return;
  try {
    await User.updateMany(
      { 'deviceTokens.deviceToken': { $in: badTokens } },
      { $pull: { deviceTokens: { deviceToken: { $in: badTokens } } } }
    );
  } catch (err) {
    console.error('[Firebase] Error cleaning invalid device tokens:', err.message);
  }
};

/**
 * Send Push Notification to one or multiple FCM device tokens
 */
export const sendPushNotification = async ({
  tokens,
  title,
  body,
  data = {},
  imageUrl = null,
  sound = 'default',
  badge = 1,
}) => {
  const tokenList = Array.isArray(tokens) ? tokens.filter(Boolean) : [tokens].filter(Boolean);

  if (!tokenList.length) {
    return { success: false, message: 'No valid device tokens provided' };
  }

  if (!isFirebaseInitialized || !messaging) {
    return { success: false, message: 'Firebase not configured' };
  }

  const stringifiedData = {};
  if (data && typeof data === 'object') {
    Object.keys(data).forEach((key) => {
      stringifiedData[key] = typeof data[key] === 'object' ? JSON.stringify(data[key]) : String(data[key]);
    });
  }

  const notificationPayload = {
    title: title || 'Karyaah Notification',
    body: body || '',
    ...(imageUrl && { imageUrl }),
  };

  const sendPromises = tokenList.map(async (token) => {
    const message = {
      token,
      notification: notificationPayload,
      data: stringifiedData,
      android: {
        priority: 'high',
        notification: {
          sound: sound || 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          channelId: 'karyaah_channel',
          ...(imageUrl && { imageUrl }),
        },
      },
      apns: {
        payload: {
          aps: {
            sound: sound || 'default',
            badge: Number(badge) || 1,
            contentAvailable: true,
          },
        },
      },
    };
    return messaging.send(message);
  });

  try {
    const results = await Promise.allSettled(sendPromises);
    const badTokens = [];
    let successCount = 0;
    let failureCount = 0;

    results.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        successCount += 1;
      } else {
        failureCount += 1;
        const err = res.reason;
        const errorCode = err && err.code;
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          badTokens.push(tokenList[idx]);
        }
      }
    });

    if (badTokens.length) {
      await cleanInvalidDeviceTokens(badTokens);
    }

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      results,
    };
  } catch (error) {
    console.error('[Firebase] Send push notification error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to a specific User by User ID or VendorUser ID
 */
export const sendNotificationToUser = async (userIdOrVendorId, payload) => {
  if (!userIdOrVendorId) return null;
  const actualUserId = await resolveUserId(userIdOrVendorId);
  if (!actualUserId) return null;

  const user = await User.findById(actualUserId).select('deviceTokens');
  if (!user || !user.deviceTokens || !user.deviceTokens.length) {
    return { success: false, message: 'User has no registered device tokens' };
  }

  const tokens = user.deviceTokens.map((item) => item.deviceToken).filter(Boolean);
  if (!tokens.length) {
    return { success: false, message: 'No valid device tokens found for user' };
  }

  return sendPushNotification({
    tokens,
    ...payload,
  });
};

/**
 * Send push notification to multiple users
 */
export const sendNotificationToUsers = async (userIds = [], payload) => {
  if (!userIds || !userIds.length) return null;
  const resolvedIds = await Promise.all(userIds.map(resolveUserId));
  const users = await User.find({ _id: { $in: resolvedIds } }).select('deviceTokens');
  const tokens = [];

  users.forEach((user) => {
    if (user.deviceTokens && user.deviceTokens.length) {
      user.deviceTokens.forEach((dt) => {
        if (dt.deviceToken) tokens.push(dt.deviceToken);
      });
    }
  });

  if (!tokens.length) {
    return { success: false, message: 'No registered device tokens found for users' };
  }

  return sendPushNotification({
    tokens,
    ...payload,
  });
};

/**
 * Create an in-app Notification record in DB AND send Push Notification via Firebase
 */
export const sendNotificationAndSave = async ({
  receiverId,
  senderId = null,
  title,
  message,
  notificationType = EnumNotificationType.GENERAL,
  related = '',
  data = {},
}) => {
  const actualReceiverId = await resolveUserId(receiverId);
  const actualSenderId = senderId ? await resolveUserId(senderId) : actualReceiverId;

  console.log(
    `[Notification:${notificationType}] 🔔 Dispatching "${title}" to User ID: ${actualReceiverId} | Related: ${
      related || 'None'
    }`
  );

  const dbNotification = await Notifications.create({
    receiverId: actualReceiverId,
    senderId: actualSenderId,
    title,
    message,
    notificationType,
    related: related ? String(related) : '',
    isRead: false,
    createdBy: actualSenderId,
    updatedBy: actualSenderId,
  });

  const pushResult = await sendNotificationToUser(actualReceiverId, {
    title,
    body: message,
    data: {
      notificationId: String(dbNotification._id),
      notificationType,
      related: related ? String(related) : '',
      ...data,
    },
  });

  if (pushResult && pushResult.success) {
    console.log(
      `[Notification:${notificationType}] ✅ Push delivered to User: ${actualReceiverId} | Sent count: ${
        pushResult.successCount || 0
      }`
    );
  } else {
    console.log(
      `[Notification:${notificationType}] ℹ️ DB record created (ID: ${dbNotification._id}). Push status: ${
        pushResult ? pushResult.message || pushResult.error || 'No active device tokens' : 'No push sent'
      }`
    );
  }

  return {
    dbNotification,
    pushResult,
  };
};

/* =========================================================================
 * PRE-CONFIGURED NOTIFICATION HANDLERS FOR APPLICATION LIFECYCLE
 * ========================================================================= */

/**
 * 1. Customer: Booking Placed
 */
export const notifyBookingPlaced = async (booking) => {
  if (!booking || !booking.customerId) return;
  const bookingDisplayId = booking.bookingId || String(booking._id).slice(-6).toUpperCase();
  return sendNotificationAndSave({
    receiverId: booking.customerId,
    senderId: booking.customerId,
    title: 'Booking Confirmed 🎉',
    message: `Your booking #${bookingDisplayId} has been successfully placed.`,
    notificationType: EnumNotificationType.BOOKING_PLACED,
    related: String(booking._id),
    data: {
      bookingId: String(booking._id),
      bookingDisplayId,
      type: 'BOOKING_DETAILS',
    },
  }).catch(() => {});
};

/**
 * 2. Vendor: New Booking Request
 */
export const notifyNewBookingRequest = async (booking, targetVendorId = null) => {
  if (!booking) return;
  const vendorId = targetVendorId || booking.vendorId;
  if (!vendorId) return;
  const bookingDisplayId = booking.bookingId || String(booking._id).slice(-6).toUpperCase();
  return sendNotificationAndSave({
    receiverId: vendorId,
    senderId: booking.customerId || vendorId,
    title: 'New Booking Request! 🔔',
    message: `You have received a new booking request #${bookingDisplayId}.`,
    notificationType: EnumNotificationType.NEW_BOOKING_REQUEST,
    related: String(booking._id),
    data: {
      bookingId: String(booking._id),
      bookingDisplayId,
      type: 'NEW_ORDER_MODAL',
    },
  }).catch(() => {});
};

/**
 * 3. Customer: Vendor Accepted Booking
 */
export const notifyBookingAccepted = async (booking, vendorName = 'Vendor') => {
  if (!booking || !booking.customerId) return;
  const bookingDisplayId = booking.bookingId || String(booking._id).slice(-6).toUpperCase();
  return sendNotificationAndSave({
    receiverId: booking.customerId,
    senderId: booking.vendorId || booking.customerId,
    title: 'Vendor Assigned 👨‍🔧',
    message: `${vendorName} has accepted your booking #${bookingDisplayId}.`,
    notificationType: EnumNotificationType.BOOKING_ACCEPTED,
    related: String(booking._id),
    data: {
      bookingId: String(booking._id),
      vendorId: String(booking.vendorId || ''),
      type: 'BOOKING_TRACKING',
    },
  }).catch(() => {});
};

/**
 * 4. Customer: Vendor On The Way
 */
export const notifyVendorOnTheWay = async (booking, vendorName = 'Vendor') => {
  if (!booking || !booking.customerId) return;
  const bookingDisplayId = booking.bookingId || String(booking._id).slice(-6).toUpperCase();
  return sendNotificationAndSave({
    receiverId: booking.customerId,
    senderId: booking.vendorId || booking.customerId,
    title: 'Vendor is on the way! 🚗',
    message: `${vendorName} is heading towards your location for booking #${bookingDisplayId}.`,
    notificationType: EnumNotificationType.VENDOR_ON_THE_WAY,
    related: String(booking._id),
    data: {
      bookingId: String(booking._id),
      type: 'BOOKING_LIVE_MAP',
    },
  }).catch(() => {});
};

/**
 * 5. Customer: Vendor Arrived
 */
export const notifyVendorArrived = async (booking, vendorName = 'Vendor') => {
  if (!booking || !booking.customerId) return;
  const bookingDisplayId = booking.bookingId || String(booking._id).slice(-6).toUpperCase();
  return sendNotificationAndSave({
    receiverId: booking.customerId,
    senderId: booking.vendorId || booking.customerId,
    title: 'Vendor has Arrived 📍',
    message: `${vendorName} has reached your service location for booking #${bookingDisplayId}.`,
    notificationType: EnumNotificationType.VENDOR_ARRIVED,
    related: String(booking._id),
    data: {
      bookingId: String(booking._id),
      type: 'BOOKING_DETAILS',
    },
  }).catch(() => {});
};

/**
 * 6. Customer: Service Completion OTP / Service Started
 */
export const notifyServiceCompletionOtp = async (booking, otp) => {
  if (!booking || !booking.customerId) return;
  const bookingDisplayId = booking.bookingId || String(booking._id).slice(-6).toUpperCase();
  return sendNotificationAndSave({
    receiverId: booking.customerId,
    senderId: booking.vendorId || booking.customerId,
    title: 'Service Completion OTP ⚡',
    message: `Your service OTP is ${otp}. Share this with the vendor to complete booking #${bookingDisplayId}.`,
    notificationType: EnumNotificationType.SERVICE_STARTED,
    related: String(booking._id),
    data: {
      bookingId: String(booking._id),
      otp: String(otp),
      type: 'BOOKING_DETAILS',
    },
  }).catch(() => {});
};

/**
 * 7. Both: Booking Completed
 */
export const notifyBookingCompleted = async (booking) => {
  if (!booking) return;
  const bookingDisplayId = booking.bookingId || String(booking._id).slice(-6).toUpperCase();

  // Notify Customer
  if (booking.customerId) {
    sendNotificationAndSave({
      receiverId: booking.customerId,
      senderId: booking.vendorId || booking.customerId,
      title: 'Service Completed ✅',
      message: `Your booking #${bookingDisplayId} has been completed. Please rate your experience!`,
      notificationType: EnumNotificationType.BOOKING_COMPLETED,
      related: String(booking._id),
      data: {
        bookingId: String(booking._id),
        type: 'RATE_REVIEW',
      },
    }).catch(() => {});
  }

  // Notify Vendor
  if (booking.vendorId) {
    sendNotificationAndSave({
      receiverId: booking.vendorId,
      senderId: booking.customerId || booking.vendorId,
      title: 'Booking Completed! 💵',
      message: `Booking #${bookingDisplayId} is completed. Earnings added to your wallet.`,
      notificationType: EnumNotificationType.PAYMENT_CREDITED,
      related: String(booking._id),
      data: {
        bookingId: String(booking._id),
        type: 'WALLET',
      },
    }).catch(() => {});
  }
};

/**
 * 8. Customer & Vendor: Booking Cancelled
 */
export const notifyBookingCancelled = async (booking, cancelledByRole, cancelReason = '') => {
  if (!booking) return;
  const bookingDisplayId = booking.bookingId || String(booking._id).slice(-6).toUpperCase();

  if (cancelledByRole === 'customer') {
    // Notify Vendor
    if (booking.vendorId) {
      sendNotificationAndSave({
        receiverId: booking.vendorId,
        senderId: booking.customerId || booking.vendorId,
        title: 'Booking Cancelled ⚠️',
        message: `Customer cancelled booking #${bookingDisplayId}.${cancelReason ? ` Reason: ${cancelReason}` : ''}`,
        notificationType: EnumNotificationType.CUSTOMER_CANCELLED_BOOKING,
        related: String(booking._id),
        data: {
          bookingId: String(booking._id),
          type: 'BOOKING_DETAILS',
        },
      }).catch(() => {});
    }
  } else if (booking.customerId) {
    // Notify Customer
    sendNotificationAndSave({
      receiverId: booking.customerId,
      senderId: booking.vendorId || booking.customerId,
      title: 'Booking Cancelled ❌',
      message: `Your booking #${bookingDisplayId} was cancelled by the vendor.${
        cancelReason ? ` Reason: ${cancelReason}` : ''
      }`,
      notificationType: EnumNotificationType.BOOKING_CANCELLED,
      related: String(booking._id),
      data: {
        bookingId: String(booking._id),
        type: 'BOOKING_DETAILS',
      },
    }).catch(() => {});
  }
};

/**
 * 9. Vendor: New Review Received
 */
export const notifyNewReview = async (review, vendorUserId, rating, comment = '') => {
  if (!vendorUserId) return;
  return sendNotificationAndSave({
    receiverId: vendorUserId,
    senderId: review.createdBy || vendorUserId,
    title: `New Review Received! ⭐ ${rating}/5`,
    message: comment ? `"${comment.slice(0, 80)}..."` : 'A customer has rated your service.',
    notificationType: EnumNotificationType.NEW_REVIEW,
    related: review._id ? String(review._id) : '',
    data: {
      reviewId: review._id ? String(review._id) : '',
      rating: String(rating),
      type: 'REVIEWS',
    },
  }).catch(() => {});
};

/**
 * 10. Chat: New Message
 */
export const notifyNewChatMessage = async ({
  recipientUserId,
  senderUserId,
  senderName = 'Someone',
  messageText = '',
  chatId = '',
}) => {
  if (!recipientUserId) return;
  return sendNotificationAndSave({
    receiverId: recipientUserId,
    senderId: senderUserId,
    title: `New message from ${senderName} 💬`,
    message: messageText ? messageText.slice(0, 100) : 'Sent an attachment',
    notificationType: EnumNotificationType.CHAT_MESSAGE,
    related: String(chatId),
    data: {
      chatId: String(chatId),
      senderId: String(senderUserId),
      type: 'CHAT',
    },
  }).catch(() => {});
};

/**
 * 11. Vendor: KYC Status Update
 */
export const notifyKycStatus = async (vendorUserId, status, reason = '') => {
  if (!vendorUserId) return;
  const isApproved = status === 'approved';
  return sendNotificationAndSave({
    receiverId: vendorUserId,
    senderId: vendorUserId,
    title: isApproved ? 'KYC Approved ✅' : 'KYC Update ❌',
    message: isApproved
      ? 'Congratulations! Your KYC documents have been verified. You can now accept customer bookings.'
      : `Your KYC verification was not approved.${
          reason ? ` Reason: ${reason}` : ' Please review your documents and re-upload.'
        }`,
    notificationType: isApproved ? EnumNotificationType.KYC_APPROVED : EnumNotificationType.KYC_REJECTED,
    related: String(vendorUserId),
    data: {
      status,
      type: isApproved ? 'PROFILE' : 'KYC_UPLOAD',
    },
  }).catch(() => {});
};

/**
 * 12. Vendor: Bank Account Verification
 */
export const notifyBankStatus = async (vendorUserId, status, bankName = '') => {
  if (!vendorUserId) return;
  const isVerified = status === 'verified';
  return sendNotificationAndSave({
    receiverId: vendorUserId,
    senderId: vendorUserId,
    title: isVerified ? 'Bank Account Verified 🏦' : 'Bank Account Update ⚠️',
    message: isVerified
      ? `Your bank account ${bankName ? `(${bankName}) ` : ''}has been successfully verified.`
      : 'Your bank account verification was rejected. Please check and re-enter your details.',
    notificationType: EnumNotificationType.BANK_VERIFIED,
    related: String(vendorUserId),
    data: {
      status,
      type: 'BANK_SETTINGS',
    },
  }).catch(() => {});
};

/**
 * 13. Login: Welcome notification for Customer and Vendor
 */
export const notifyLoginSuccess = async (user) => {
  if (!user || !user._id) {
    console.warn('[Notification:Login] Skipped: No valid user object provided.');
    return;
  }
  const isVendor = user.role === 'vendor';
  const name = user.fullName || user.name || (isVendor ? 'Partner' : 'User');
  const userIdentifier = user.email || user.mobileNumber || user._id;
  const tokenCount = (user.deviceTokens && user.deviceTokens.length) || 0;

  console.log(
    `[Notification:Login] 🚀 Sending welcome notification to ${
      isVendor ? 'Vendor' : 'Customer'
    }: "${name}" (${userIdentifier}) | Active device tokens: ${tokenCount}`
  );

  try {
    const result = await sendNotificationAndSave({
      receiverId: user._id,
      senderId: user._id,
      title: isVendor ? 'Welcome Back, Partner! 🛠️' : 'Welcome Back! 👋',
      message: isVendor
        ? `Hello ${name}, you have successfully logged in to the Karyaah Partner Portal.`
        : `Hello ${name}, you have successfully logged in to Karyaah.`,
      notificationType: EnumNotificationType.LOGIN_SUCCESS,
      related: String(user._id),
      data: {
        userId: String(user._id),
        role: user.role || (isVendor ? 'vendor' : 'customer'),
        type: 'PROFILE',
      },
    });

    if (result && result.pushResult && result.pushResult.success) {
      console.log(
        `[Notification:Login] ✅ Push notification delivered for ${name} (${userIdentifier}) | Success count: ${
          result.pushResult.successCount || 0
        }, Failure count: ${result.pushResult.failureCount || 0}`
      );
    } else if (tokenCount === 0) {
      console.log(
        `[Notification:Login] ℹ️ In-app notification saved in DB for ${name}, but no FCM push sent because deviceToken was not provided.`
      );
    } else {
      console.warn(
        `[Notification:Login] ⚠️ Push result for ${name}:`,
        result && result.pushResult ? result.pushResult.message || result.pushResult.error : 'No response'
      );
    }

    return result;
  } catch (err) {
    console.error(`[Notification:Login] ❌ Error dispatching login notification to ${name}:`, err.message);
  }
};

/**
 * Backward compatibility alias
 */
export const sendNotification = async (deviceToken, message) => {
  const title = message.title || (message.notification && message.notification.title) || 'Notification';
  const body = message.body || (message.notification && message.notification.body) || '';
  const data = message.data || {};
  return sendPushNotification({
    tokens: deviceToken,
    title,
    body,
    data,
  });
};
