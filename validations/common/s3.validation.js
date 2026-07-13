import Joi from 'joi';
import enumFields from '../../models/enum.model';

Joi.objectId = require('joi-objectid')(Joi);
// eslint-disable-next-line import/prefer-default-export
export const preSignedPutUrl = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    contentType: Joi.string().required(),
  }),
};

export const UserProfilePic = {
  body: Joi.object().keys({
    key: Joi.string().required(),
    contentType: Joi.string().required(),
    profileType: Joi.string()
      .valid(...Object.values(enumFields.EnumOfImageTypes))
      .required(),
    isProfilePic: Joi.boolean(),
    caption: Joi.string(),
  }),
};
