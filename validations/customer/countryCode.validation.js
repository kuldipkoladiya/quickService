import Joi from 'joi';

Joi.objectId = require('joi-objectid')(Joi);

export const createCountryCode = {
  body: Joi.object().keys({
    country: Joi.string().required(),
    code: Joi.number().required(),
    createdBy: Joi.objectId(),
    updatedBy: Joi.objectId(),
  }),
};

export const updateCountryCode = {
  body: Joi.object().keys({}),
  params: Joi.object().keys({
    countryCodeId: Joi.objectId().required(),
  }),
};

export const getCountryCodeById = {
  params: Joi.object().keys({
    countryCodeId: Joi.objectId().required(),
  }),
};

export const deleteCountryCodeById = {
  params: Joi.object().keys({
    countryCodeId: Joi.objectId().required(),
  }),
};

export const getCountryCode = {
  body: Joi.object().keys({}).unknown(true),
};

export const paginatedCountryCode = {
  body: Joi.object().keys({}).unknown(true),
  query: Joi.object()
    .keys({
      page: Joi.number().default(1),
      limit: Joi.number().default(10).max(100),
    })
    .unknown(true),
};
