import mongoose from 'mongoose';
import httpStatus from 'http-status';
import ApiError from 'utils/ApiError';
import { Reviews, Bookings, User, VendorUser } from 'models';
import { EnumStatusOfBookings } from 'models/enum.model';

export const defaultReviewPopulate = [
  {
    path: 'customerId',
    select: 'name fullName email mobileNumber countryCode profileImage profilePic userProfilePic',
  },
  {
    path: 'vendorId',
    select: 'businessName rating totalReviews serviceRadius kycStatus profileCompleted avgResponseTime userId categoryId',
    populate: [
      {
        path: 'userId',
        select: 'name fullName mobileNumber email profileImage profilePic',
      },
      {
        path: 'categoryId',
        select: 'title icon image',
      },
    ],
  },
  {
    path: 'bookingId',
    select: 'bookingId status bookingType bookingDate bookingTime totalAmount serviceId serviceIds',
    populate: {
      path: 'serviceId',
      select: 'name title image',
    },
  },
];

/**
 * Recalculate average rating and total reviews for a vendor
 * @param {string|ObjectId} vendorId
 */
export async function recalculateVendorRating(vendorId) {
  if (!vendorId) return { rating: 0, totalReviews: 0 };
  try {
    const vObjectId = mongoose.Types.ObjectId.isValid(vendorId) ? new mongoose.Types.ObjectId(vendorId) : vendorId;

    const stats = await Reviews.aggregate([
      {
        $match: {
          vendorId: vObjectId,
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: '$vendorId',
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const rating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    await VendorUser.findByIdAndUpdate(vObjectId, {
      rating,
      totalReviews,
    });

    return { rating, totalReviews };
  } catch (error) {
    console.error('[Reviews] Error recalculating vendor rating:', error.message);
    return { rating: 0, totalReviews: 0 };
  }
}

/**
 * Get comprehensive review statistics and 1-5 star breakdown for a vendor
 * @param {string|ObjectId} vendorId
 */
export async function getVendorReviewStats(vendorId) {
  if (!vendorId) return null;
  const vObjectId = mongoose.Types.ObjectId.isValid(vendorId) ? new mongoose.Types.ObjectId(vendorId) : vendorId;

  const match = {
    vendorId: vObjectId,
    isDeleted: { $ne: true },
  };

  const [aggregateData, ratingCounts] = await Promise.all([
    Reviews.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]),
    Reviews.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const totalReviews = aggregateData[0] ? aggregateData[0].totalReviews : 0;
  const avgRating = aggregateData[0] ? Math.round(aggregateData[0].avgRating * 10) / 10 : 0;

  const breakdown = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  };

  ratingCounts.forEach((rc) => {
    const rounded = Math.round(rc._id);
    if (breakdown[rounded] !== undefined) {
      breakdown[rounded] += rc.count;
    }
  });

  const breakdownWithPercentage = {};
  Object.keys(breakdown).forEach((star) => {
    const count = breakdown[star];
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    breakdownWithPercentage[star] = {
      count,
      percentage,
    };
  });

  return {
    averageRating: avgRating,
    totalReviews,
    breakdown: breakdownWithPercentage,
  };
}

export async function getReviewsById(id, options = {}) {
  let query = Reviews.findById(id, options.projection, options);
  if (options.populate !== false) {
    query = query.populate(options.populate || defaultReviewPopulate);
  }
  return query;
}

export async function getOne(queryFilter, options = {}) {
  let query = Reviews.findOne(queryFilter, options.projection, options);
  if (options.populate !== false) {
    query = query.populate(options.populate || defaultReviewPopulate);
  }
  return query;
}

export async function getReviewsList(filter, options = {}) {
  let query = Reviews.find(filter, options.projection, options);
  if (options.populate !== false) {
    query = query.populate(options.populate || defaultReviewPopulate);
  }
  if (options.sortBy) {
    const sort = {};
    sort[options.sortBy] = options.sortOrder === 'desc' || options.sortOrder === -1 ? -1 : 1;
    query = query.sort(sort);
  } else {
    query = query.sort({ createdAt: -1 });
  }
  return query;
}

export async function getReviewsListWithPagination(filter, options = {}) {
  const paginateOptions = {
    ...options,
    populate: options.populate !== false ? options.populate || defaultReviewPopulate : undefined,
    sort: options.sort || { createdAt: -1 },
  };
  return Reviews.paginate(filter, paginateOptions);
}

/**
 * Customer creates a review for a booking
 */
export async function createCustomerReview(customerId, body = null) {
  const { bookingId, rating, review: reviewText } = body;

  if (!bookingId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'bookingId is required to submit a review');
  }

  // 1. Verify booking exists
  const booking = await Bookings.findById(bookingId);
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // 2. Verify booking ownership
  if (booking.customerId && booking.customerId.toString() !== customerId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to review this booking');
  }

  // 3. Verify booking is completed
  const isCompleted = booking.status === EnumStatusOfBookings.COMPLETED || booking.status === 'completed';
  if (!isCompleted) {
    throw new ApiError(httpStatus.BAD_REQUEST, `You can only review a completed booking. Current status: ${booking.status}`);
  }

  // 4. Check for duplicate review
  const existingReview = await Reviews.findOne({
    bookingId,
    isDeleted: { $ne: true },
  });
  if (existingReview) {
    throw new ApiError(httpStatus.CONFLICT, 'You have already submitted a review for this booking');
  }

  // 5. Vendor ID from booking or body
  const vendorId = body.vendorId || booking.vendorId;
  if (!vendorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Booking does not have an assigned vendor');
  }

  // 6. Create Review document
  const reviewDoc = await Reviews.create({
    bookingId,
    customerId,
    vendorId,
    rating: Number(rating),
    review: reviewText || '',
    createdBy: customerId,
    updatedBy: customerId,
  });

  // 7. Update Booking isReviewed status
  await Bookings.findByIdAndUpdate(bookingId, {
    isReviewed: true,
    reviewId: reviewDoc._id,
  });

  // 8. Recalculate Vendor Rating
  await recalculateVendorRating(vendorId);

  // 9. Fetch populated review
  const populatedReview = await Reviews.findById(reviewDoc._id).populate(defaultReviewPopulate);

  return {
    review: populatedReview,
    booking,
    vendorId,
  };
}

/**
 * Customer updates their review
 */
export async function updateCustomerReview(customerId, reviewsId, body) {
  const review = await Reviews.findOne({ _id: reviewsId, isDeleted: { $ne: true } });
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  if (review.customerId && review.customerId.toString() !== customerId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this review');
  }

  if (body.rating !== undefined) {
    review.rating = Number(body.rating);
  }
  if (body.review !== undefined) {
    review.review = body.review;
  }
  review.updatedBy = customerId;
  await review.save();

  if (review.vendorId) {
    await recalculateVendorRating(review.vendorId);
  }

  return Reviews.findById(review._id).populate(defaultReviewPopulate);
}

/**
 * Customer deletes their review
 */
export async function removeCustomerReview(customerId, reviewsId) {
  const review = await Reviews.findOne({ _id: reviewsId, isDeleted: { $ne: true } });
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  if (review.customerId && review.customerId.toString() !== customerId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this review');
  }

  const { bookingId, vendorId } = review;

  await Reviews.findByIdAndDelete(review._id);

  if (bookingId) {
    await Bookings.findByIdAndUpdate(bookingId, {
      isReviewed: false,
      reviewId: null,
    });
  }

  if (vendorId) {
    await recalculateVendorRating(vendorId);
  }

  return { message: 'Review deleted successfully' };
}

/**
 * Vendor replies to a customer review
 */
export async function vendorReplyToReview(vendorId, reviewsId, vendorReply, vendorUserId) {
  const review = await Reviews.findOne({ _id: reviewsId, isDeleted: { $ne: true } });
  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
  }

  // Verify vendor ownership
  if (review.vendorId && review.vendorId.toString() !== vendorId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to reply to this review');
  }

  review.vendorReply = vendorReply;
  review.vendorRepliedAt = new Date();
  review.updatedBy = vendorUserId;
  await review.save();

  return Reviews.findById(review._id).populate(defaultReviewPopulate);
}

export async function createReviews(body = {}) {
  if (body.bookingId) {
    const booking = await Bookings.findOne({ _id: body.bookingId });
    if (!booking) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field bookingId is not valid');
    }
  }
  if (body.customerId) {
    const customer = await User.findOne({ _id: body.customerId });
    if (!customer) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field customerId is not valid');
    }
  }
  if (body.vendorId) {
    const vendor = await VendorUser.findOne({ _id: body.vendorId });
    if (!vendor) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field vendorId is not valid');
    }
  }
  const review = await Reviews.create(body);
  if (body.vendorId) {
    await recalculateVendorRating(body.vendorId);
  }
  return review;
}

export async function updateReviews(filter, body, options = {}) {
  const review = await Reviews.findOneAndUpdate(filter, body, options);
  if (review && review.vendorId) {
    await recalculateVendorRating(review.vendorId);
  }
  return review;
}

export async function updateManyReviews(filter, body, options = {}) {
  return Reviews.updateMany(filter, body, options);
}

export async function removeReviews(filter) {
  const review = await Reviews.findOneAndRemove(filter);
  if (review && review.vendorId) {
    await recalculateVendorRating(review.vendorId);
  }
  return review;
}

export async function removeManyReviews(filter) {
  return Reviews.deleteMany(filter);
}

export async function aggregateReviews(query) {
  return Reviews.aggregate(query);
}

export async function aggregateReviewsWithPagination(query, options = {}) {
  const aggregate = Reviews.aggregate();
  query.forEach((obj) => {
    aggregate._pipeline.push(obj);
  });
  return Reviews.aggregatePaginate(aggregate, options);
}
