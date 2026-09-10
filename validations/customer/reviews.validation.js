import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createReviews = {
  body: Joi.object().keys({
    bookingId: Joi.objectId().required(),
    rating: Joi.number().min(1).max(5).required(),
    review: Joi.string().trim().allow('', null),
    vendorId: Joi.objectId().optional(),
  }),
};

export const updateReviews = {
  params: Joi.object().keys({
    reviewsId: Joi.objectId().required(),
  }),
  body: Joi.object()
    .keys({
      rating: Joi.number().min(1).max(5),
      review: Joi.string().trim().allow('', null),
    })
    .min(1),
};

export const getReviewsById = {
  params: Joi.object().keys({
    reviewsId: Joi.objectId().required(),
  }),
};

export const deleteReviewsById = {
  params: Joi.object().keys({
    reviewsId: Joi.objectId().required(),
  }),
};

export const getReviewByBooking = {
  params: Joi.object().keys({
    bookingId: Joi.objectId().required(),
  }),
};

export const getVendorReviewSummary = {
  params: Joi.object().keys({
    vendorId: Joi.objectId().required(),
  }),
};

export const getReviews = {
  query: Joi.object()
    .keys({
      vendorId: Joi.objectId(),
      bookingId: Joi.objectId(),
      rating: Joi.number().min(1).max(5),
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(100),
      sortBy: Joi.string(),
      sortOrder: Joi.string().valid('asc', 'desc', '1', '-1'),
    })
    .unknown(true),
};

export const paginatedReviews = {
  query: Joi.object()
    .keys({
      vendorId: Joi.objectId(),
      bookingId: Joi.objectId(),
      rating: Joi.number().min(1).max(5),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().default('createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc', '1', '-1').default('desc'),
    })
    .unknown(true),
};
