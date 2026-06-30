import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createBusinessAddress = {
  body: Joi.object().keys({
    userId: Joi.objectId().optional(),
    addressLine1: Joi.string().required(),
    addressLine2: Joi.string().allow('').optional(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pinCode: Joi.string().required(),
  }),
};

export const updateBusinessAddress = {
  body: Joi.object().keys({
    userId: Joi.objectId().optional(),
    addressLine1: Joi.string().optional(),
    addressLine2: Joi.string().allow('').optional(),
    city: Joi.string().optional(),
    state: Joi.string().optional(),
    pinCode: Joi.string().optional(),
  }),
  params: Joi.object().keys({
    businessAddressId: Joi.objectId().required(),
  }),
};

export const getBusinessAddressById = {
  params: Joi.object().keys({
    businessAddressId: Joi.objectId().required(),
  }),
};

export const deleteBusinessAddressById = {
  params: Joi.object().keys({
    businessAddressId: Joi.objectId().required(),
  }),
};

export const getBusinessAddress = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number(),
      limit: Joi.number(),
    })
    .unknown(true),
};

export const paginatedBusinessAddress = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
