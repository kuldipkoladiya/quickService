import httpStatus from 'http-status';
import { VendorUser } from 'models';
import { reviewsService, notificationService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { pick } from 'utils/pick';

/**
 * Resolve vendor's VendorUser._id from req.user
 */
const resolveVendorId = async (user) => {
  if (!user) return null;
  const vendorUser = await VendorUser.findOne({
    userId: user._id,
    isDeleted: { $ne: true },
  });
  return vendorUser ? vendorUser._id : user._id;
};

export const listReviews = catchAsync(async (req, res) => {
  const vendorId = await resolveVendorId(req.user);

  const filter = {
    vendorId,
    isDeleted: { $ne: true },
  };

  if (req.query.rating) {
    filter.rating = Number(req.query.rating);
  }
  if (req.query.bookingId) {
    filter.bookingId = req.query.bookingId;
  }

  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
  if (options.page) options.page = parseInt(options.page, 10);
  if (options.limit) options.limit = parseInt(options.limit, 10);

  if (req.query.page || req.query.limit) {
    const reviews = await reviewsService.getReviewsListWithPagination(filter, options);
    return res.status(httpStatus.OK).send({ results: reviews });
  }

  const reviews = await reviewsService.getReviewsList(filter, options);
  return res.status(httpStatus.OK).send({ results: reviews });
});

export const paginateReviews = catchAsync(async (req, res) => {
  const vendorId = await resolveVendorId(req.user);

  const filter = {
    vendorId,
    isDeleted: { $ne: true },
  };

  if (req.query.rating) {
    filter.rating = Number(req.query.rating);
  }
  if (req.query.bookingId) {
    filter.bookingId = req.query.bookingId;
  }

  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
  if (options.page) options.page = parseInt(options.page, 10);
  if (options.limit) options.limit = parseInt(options.limit, 10);

  const reviews = await reviewsService.getReviewsListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: reviews });
});

export const getReviewsSummary = catchAsync(async (req, res) => {
  const vendorId = await resolveVendorId(req.user);
  const stats = await reviewsService.getVendorReviewStats(vendorId);
  return res.status(httpStatus.OK).send({ results: stats });
});

export const getReviews = catchAsync(async (req, res) => {
  const { reviewsId } = req.params;
  const review = await reviewsService.getReviewsById(reviewsId);
  return res.status(httpStatus.OK).send({ results: review });
});

export const replyToReview = catchAsync(async (req, res) => {
  const vendorId = await resolveVendorId(req.user);
  const { reviewsId } = req.params;
  const { vendorReply } = req.body;

  const updatedReview = await reviewsService.vendorReplyToReview(vendorId, reviewsId, vendorReply, req.user._id);

  // Send notification to customer that vendor has replied
  const vendorName =
    (updatedReview.vendorId && updatedReview.vendorId.businessName) || req.user.fullName || req.user.name || 'Vendor';

  const customerId =
    updatedReview.customerId && updatedReview.customerId._id ? updatedReview.customerId._id : updatedReview.customerId;

  if (customerId) {
    notificationService
      .notifyVendorReviewReply(updatedReview, customerId, vendorName, vendorReply)
      .catch((err) => console.error('[ReviewNotification] Error notifying customer of reply:', err.message));
  }

  return res.status(httpStatus.OK).send({
    message: 'Reply posted successfully',
    results: updatedReview,
  });
});

export const createReviews = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user._id;
  body.updatedBy = req.user._id;
  const options = {};
  const reviews = await reviewsService.createReviews(body, options);
  return res.status(httpStatus.CREATED).send({ results: reviews });
});

export const updateReviews = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { reviewsId } = req.params;
  const filter = {
    _id: reviewsId,
  };
  const options = { new: true };
  const reviews = await reviewsService.updateReviews(filter, body, options);
  return res.status(httpStatus.OK).send({ results: reviews });
});

export const removeReviews = catchAsync(async (req, res) => {
  const { reviewsId } = req.params;
  const filter = {
    _id: reviewsId,
  };
  const reviews = await reviewsService.removeReviews(filter);
  return res.status(httpStatus.OK).send({ results: reviews });
});
