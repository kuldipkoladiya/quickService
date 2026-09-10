import httpStatus from 'http-status';
import { reviewsService, notificationService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import { pick } from 'utils/pick';

export const createReviews = catchAsync(async (req, res) => {
  const customerId = req.user._id;
  const { review, vendorId } = await reviewsService.createCustomerReview(customerId, req.body, req.user);

  // Dispatch complete notifications to both Vendor and Customer
  const customerName = req.user.fullName || req.user.name || 'A customer';
  const vendorName = (review.vendorId && review.vendorId.businessName) || 'the vendor';

  // 1. Notify Vendor: New Review Received
  if (vendorId) {
    notificationService
      .notifyNewReview(review, vendorId, review.rating, review.review, customerName)
      .catch((err) => console.error('[ReviewNotification] Error notifying vendor:', err.message));
  }

  // 2. Notify Customer: Confirmation of review submitted
  notificationService
    .notifyReviewSubmittedToCustomer(review, customerId, vendorName)
    .catch((err) => console.error('[ReviewNotification] Error notifying customer:', err.message));

  return res.status(httpStatus.CREATED).send({
    message: 'Review submitted successfully',
    results: review,
  });
});

export const listReviews = catchAsync(async (req, res) => {
  const filter = {
    isDeleted: { $ne: true },
  };

  // If vendorId is specified, customer is viewing reviews of a particular vendor
  if (req.query.vendorId) {
    filter.vendorId = req.query.vendorId;
  } else {
    // Otherwise customer views reviews they have written
    filter.customerId = req.user._id;
  }

  if (req.query.bookingId) {
    filter.bookingId = req.query.bookingId;
  }
  if (req.query.rating) {
    filter.rating = Number(req.query.rating);
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
  const filter = {
    isDeleted: { $ne: true },
  };

  if (req.query.vendorId) {
    filter.vendorId = req.query.vendorId;
  } else {
    filter.customerId = req.user._id;
  }

  if (req.query.bookingId) {
    filter.bookingId = req.query.bookingId;
  }
  if (req.query.rating) {
    filter.rating = Number(req.query.rating);
  }

  const options = pick(req.query, ['page', 'limit', 'sortBy', 'sortOrder']);
  if (options.page) options.page = parseInt(options.page, 10);
  if (options.limit) options.limit = parseInt(options.limit, 10);

  const reviews = await reviewsService.getReviewsListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: reviews });
});

export const getReviews = catchAsync(async (req, res) => {
  const { reviewsId } = req.params;
  const review = await reviewsService.getReviewsById(reviewsId);
  return res.status(httpStatus.OK).send({ results: review });
});

export const getReviewByBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const review = await reviewsService.getOne({
    bookingId,
    isDeleted: { $ne: true },
  });
  return res.status(httpStatus.OK).send({ results: review });
});

export const getVendorReviewSummary = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const summary = await reviewsService.getVendorReviewStats(vendorId);
  return res.status(httpStatus.OK).send({ results: summary });
});

export const updateReviews = catchAsync(async (req, res) => {
  const { reviewsId } = req.params;
  const review = await reviewsService.updateCustomerReview(req.user._id, reviewsId, req.body);
  return res.status(httpStatus.OK).send({
    message: 'Review updated successfully',
    results: review,
  });
});

export const removeReviews = catchAsync(async (req, res) => {
  const { reviewsId } = req.params;
  const result = await reviewsService.removeCustomerReview(req.user._id, reviewsId);
  return res.status(httpStatus.OK).send({ results: result });
});
