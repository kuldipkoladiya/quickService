import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const getReviews = {
  query: Joi.object()
    .keys({
      rating: Joi.number().min(1).max(5),
      bookingId: Joi.objectId(),
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
      rating: Joi.number().min(1).max(5),
      bookingId: Joi.objectId(),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sortBy: Joi.string().default('createdAt'),
      sortOrder: Joi.string().valid('asc', 'desc', '1', '-1').default('desc'),
    })
    .unknown(true),
};

export const getReviewsById = {
  params: Joi.object().keys({
    reviewsId: Joi.objectId().required(),
  }),
};

export const replyReview = {
  params: Joi.object().keys({
    reviewsId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    vendorReply: Joi.string().trim().required(),
  }),
};

export const createReviews = {
  body: Joi.object().keys({
    bookingId: Joi.objectId(),
    customerId: Joi.objectId(),
    vendorId: Joi.objectId(),
    rating: Joi.number().min(1).max(5),
    review: Joi.string(),
  }),
};

export const updateReviews = {
  params: Joi.object().keys({
    reviewsId: Joi.objectId().required(),
  }),
  body: Joi.object().keys({
    rating: Joi.number().min(1).max(5),
    review: Joi.string(),
    vendorReply: Joi.string(),
  }),
};

export const deleteReviewsById = {
  params: Joi.object().keys({
    reviewsId: Joi.objectId().required(),
  }),
};
