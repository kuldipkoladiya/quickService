import httpStatus from 'http-status';
import { VendorUser } from 'models';
import { reviewsService, notificationService } from 'services';
import ApiError from 'utils/ApiError';
import { catchAsync } from 'utils/catchAsync';

/**
 * Resolve vendor's VendorUser._id from req.user
 */
const resolveVendorId = async (user) => {
  if (!user) return null;
  const vendorUser = await VendorUser.findOne({
    userId: user._id,
    isDeleted: { $ne: true },
  });
  if (vendorUser) return vendorUser._id;
  const directVendor = await VendorUser.findById(user._id);
  if (directVendor) return directVendor._id;
  return user._id;
};

/**
 * Build Mongoose filter and pagination/sort options for reviews list
 */
const buildReviewFilterAndSort = (vendorId, query) => {
  const filter = {
    vendorId,
    isDeleted: { $ne: true },
  };

  if (query.rating) {
    filter.rating = Number(query.rating);
  }
  if (query.bookingId) {
    filter.bookingId = query.bookingId;
  }
  if (query.isReplied !== undefined) {
    const isReplied = query.isReplied === 'true' || query.isReplied === true;
    if (isReplied) {
      filter.vendorReply = { $exists: true, $nin: [null, ''] };
    } else {
      filter.$or = [{ vendorReply: { $exists: false } }, { vendorReply: null }, { vendorReply: '' }];
    }
  }

  const sort = {};
  if (query.sort) {
    const s = query.sort.toLowerCase();
    if (s === 'oldest') {
      sort.createdAt = 1;
    } else if (s === 'highest') {
      sort.rating = -1;
      sort.createdAt = -1;
    } else if (s === 'lowest') {
      sort.rating = 1;
      sort.createdAt = -1;
    } else {
      sort.createdAt = -1;
    }
  } else if (query.sortBy) {
    const isAsc = query.sortOrder === 'asc' || query.sortOrder === '1' || query.sortOrder === 1;
    sort[query.sortBy] = isAsc ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;

  return { filter, options: { page, limit, sort } };
};

export const listReviews = catchAsync(async (req, res) => {
  const vendorId = await resolveVendorId(req.user);
  const { filter, options } = buildReviewFilterAndSort(vendorId, req.query);

  const [reviewsData, stats] = await Promise.all([
    reviewsService.getReviewsListWithPagination(filter, options),
    reviewsService.getVendorReviewStats(vendorId),
  ]);

  const formattedDocs = (reviewsData.docs || []).map(reviewsService.formatReviewForUI);

  return res.status(httpStatus.OK).send({
    summary: stats,
    pagination: {
      page: reviewsData.page,
      limit: reviewsData.limit,
      totalPages: reviewsData.totalPages,
      totalResults: reviewsData.totalDocs,
      totalDocs: reviewsData.totalDocs,
      hasNextPage: reviewsData.hasNextPage,
      hasPrevPage: reviewsData.hasPrevPage,
    },
    results: {
      ...reviewsData,
      docs: formattedDocs,
    },
    data: formattedDocs,
  });
});

export const paginateReviews = listReviews;

export const getReviewsSummary = catchAsync(async (req, res) => {
  const vendorId = await resolveVendorId(req.user);
  const stats = await reviewsService.getVendorReviewStats(vendorId);
  return res.status(httpStatus.OK).send({ results: stats });
});

export const getReviews = catchAsync(async (req, res) => {
  const { reviewsId } = req.params;
  const review = await reviewsService.getReviewsById(reviewsId);
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }
  const formattedReview = reviewsService.formatReviewForUI(review);
  return res.status(httpStatus.OK).send({ results: formattedReview });
});

export const replyToReview = catchAsync(async (req, res) => {
  const vendorId = await resolveVendorId(req.user);
  const { reviewsId } = req.params;
  const replyText = (req.body.vendorReply || req.body.reply || '').trim();

  if (!replyText) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'vendorReply or reply is required');
  }

  const updatedReview = await reviewsService.vendorReplyToReview(vendorId, reviewsId, replyText, req.user._id);

  // Send notification to customer that vendor has replied
  const vendorName =
    (updatedReview.vendorId && updatedReview.vendorId.businessName) || req.user.fullName || req.user.name || 'Vendor';

  const customerId =
    updatedReview.customerId && updatedReview.customerId._id ? updatedReview.customerId._id : updatedReview.customerId;

  if (customerId) {
    notificationService
      .notifyVendorReviewReply(updatedReview, customerId, vendorName, replyText)
      .catch((err) => console.error('[ReviewNotification] Error notifying customer of reply:', err.message));
  }

  const formattedReview = reviewsService.formatReviewForUI(updatedReview);

  return res.status(httpStatus.OK).send({
    message: 'Reply posted successfully',
    results: formattedReview,
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
