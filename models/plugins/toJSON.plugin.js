/* eslint-disable no-param-reassign */
/**
 * A mongoose schema plugin which applies the following in the toJSON transform call:
 *  - removes __v, createdAt, updatedAt, and any path that has private: true
 *  - replaces _id with id
 */
const { normalizeS3ProfileUrl } = require('../../utils/common');

const toJSON = (schema) => {
  let transform;
  if (schema.options.toJSON && schema.options.toJSON.transform) {
    transform = schema.options.toJSON.transform;
  }
  schema.options.toJSON = Object.assign(schema.options.toJSON || {}, {
    transform(doc, ret, options) {
      Object.keys(schema.paths).forEach((path) => {
        if (schema.paths[path].options && schema.paths[path].options.private) {
          delete ret[path];
        }
      });
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.createdAt;
      delete ret.updatedAt;

      if (ret.profilePic) {
        ret.profilePic = normalizeS3ProfileUrl(ret.profilePic);
      }
      if (ret.profileImage) {
        ret.profileImage = normalizeS3ProfileUrl(ret.profileImage);
      }
      if (ret.profilePic && !ret.profileImage) {
        ret.profileImage = ret.profilePic;
      }
      if (ret.profileImage && !ret.profilePic) {
        ret.profilePic = ret.profileImage;
      }
      if (Array.isArray(ret.userProfilePic)) {
        ret.userProfilePic.forEach((p) => {
          if (p && p.url) {
            p.url = normalizeS3ProfileUrl(p.url);
          }
        });
      }

      if (transform) {
        return transform(doc, ret, options);
      }
    },
    virtuals: true,
  });
};
module.exports = toJSON;
