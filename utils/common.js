import { Mongoose } from 'mongoose';
import contentType from './content-type.json';
import config from '../config/config';
/* eslint-disable */
export const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index += 1) {
    await callback(array[index], index, array);
  }
};

/* eslint-enable */
/**
 * Check Whether Object is Mongoose Model
 * @param object
 * @returns {boolean}
 */
export const isMongooseModel = (object = {}) => {
  return object instanceof Mongoose.prototype.Model;
};

/**
 * Check Whether Object is Mongoose Documents
 * @param object
 * @returns {boolean}
 */
export const isMongooseDocument = (object = {}) => {
  return object instanceof Mongoose.prototype.Document;
};

/**
 * Check Whether Object is Mongoose ObjectId
 * @param data
 * @returns {boolean}
 */
export const isObjectId = (data = {}) => {
  return Mongoose.prototype.isValidObjectId(data);
};

/**
 * @param {String} string
 * @returns {string}
 */
export const capitalizeFirstLetter = (string = '') => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

/**
 *
 * @returns {number}
 */
export const generateOtp = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

export const transFormCardResponse = (paymentMethod) => {
  const {
    card: { exp_month: expMonth, exp_year: expYear, last4 },
    billing_details: {
      address: { city, country, line1, line2, postal_code: postalCode, state },
      name,
    },
    id,
  } = paymentMethod;
  return { expMonth, expYear, last4, id, city, country, line1, line2, postalCode, state, name };
};

export const transFormAccountResponse = (account) => {
  const { object } = account;
  if (object === 'bank_account') {
    const { bank_name: bankName, country, last4, routing_number: routingNumber } = account;
    return { type: 'payout', object, bankName, country, last4, routingNumber };
  }
  if (object === 'card') {
    const { brand, country, exp_month: expMonth, exp_year: expYear, funding, last4 } = account;
    return { type: 'payout', object, brand, country, expMonth, expYear, funding, last4 };
  }
  return {};
};

export const getUserField = (field = '') => {
  return `firstName lastName ${field}`;
};
/* eslint-disable */
export function sortObjectByKeys(o) {
  return Object.keys(o)
    .sort()
    .reduce((r, k) => ((r[k] = o[k]), r), {});
}

/* eslint-enable */
export const getBatchedIterable = async function* (cursor, batchSize) {
  let batch = [];
  let hasNext = false;
  do {
    /* eslint-disable no-await-in-loop */
    const item = await cursor.next();
    /* eslint-enable no-await-in-loop */
    hasNext = !!item;
    if (hasNext) batch.push(item);
    if (batch.length === batchSize) {
      yield batch;
      batch = [];
    }
  } while (hasNext);
  if (batch.length) yield batch;
};

export const getQueueUrlFromArn = (arn, sqs) => {
  const accountId = arn.split(':')[4];
  const queueName = arn.split(':')[5];
  return `${sqs.endpoint.href + accountId}/${queueName}`;
};

export const validUrl = (s) => {
  try {
    const url = new URL(s);
    return url;
  } catch (err) {
    return false;
  }
};

export const addDays = (theDate, days) => {
  return new Date(theDate.getTime() + days * 24 * 60 * 60 * 1000);
};

export const getMimeType = (allowedExtension) => {
  return allowedExtension.map((ext) => {
    const obj = contentType.find((c) => c.key === ext);
    return obj ? obj.mimeType : '';
  });
};

export const normalizeS3ProfileUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  let trimmed = url.trim();
  if (!trimmed) return trimmed;

  const bucket =
    config.aws && config.aws.bucket && config.aws.bucket !== 'aws_bucket_name'
      ? config.aws.bucket
      : 'hapmeet-user-images-712789089772-ap-south-1-an';
  const region = config.aws && config.aws.region && config.aws.region !== 'bucket_region' ? config.aws.region : 'ap-south-1';
  const correctBase = `https://${bucket}.s3.${region}.amazonaws.com/`;

  // Strip presigned signature query parameters if present on S3 URL
  if (trimmed.includes('amazonaws.com') && (trimmed.includes('AWSAccessKeyId') || trimmed.includes('X-Amz-'))) {
    const [baseUrl] = trimmed.split('?');
    trimmed = baseUrl;
  }

  // 1. Replace trendigo-s3 domains (e.g. https://trendigo-s3.s3.amazonaws.com/)
  if (/https?:\/\/trendigo-s3\.s3[^/]*\//i.test(trimmed)) {
    return trimmed.replace(/https?:\/\/trendigo-s3\.s3[^/]*\//i, correctBase);
  }

  // 2. If it's a bare S3 key (e.g. users/.../images.jpeg)
  if (trimmed.startsWith('users/')) {
    return `${correctBase}${trimmed}`;
  }

  return trimmed;
};

export const formatNumberK = (num) => {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (Number.isNaN(n)) return '0';
  if (n >= 1000000) {
    const formatted = (n / 1000000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}M`;
  }
  if (n >= 1000) {
    const formatted = (n / 1000).toFixed(1).replace(/\.0$/, '');
    return `${formatted}k`;
  }
  return n.toString();
};

export const formatTimeAgo = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 0 || diffInSeconds < 60) {
    return 'Just now';
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 min ago' : `${diffInMinutes} mins ago`;
  }
  const diffInHours = Math.floor(diffInSeconds / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  }
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  }
  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
};

export const extractProfilePic = (userOrVendor) => {
  if (!userOrVendor || typeof userOrVendor !== 'object') return null;

  // 1. Current active profilePic field (e.g. hapmeet-user-images)
  if (typeof userOrVendor.profilePic === 'string' && userOrVendor.profilePic.trim().length > 0) {
    return normalizeS3ProfileUrl(userOrVendor.profilePic.trim());
  }

  // 2. Latest active userProfilePic array entry
  if (Array.isArray(userOrVendor.userProfilePic) && userOrVendor.userProfilePic.length > 0) {
    for (let i = userOrVendor.userProfilePic.length - 1; i >= 0; i -= 1) {
      const p = userOrVendor.userProfilePic[i];
      if (p) {
        if (typeof p === 'string' && p.trim().length > 0) {
          return normalizeS3ProfileUrl(p.trim());
        }
        if (typeof p === 'object') {
          if (!p.isDeleted && !p.deleted && typeof p.url === 'string' && p.url.trim().length > 0) {
            return normalizeS3ProfileUrl(p.url.trim());
          }
          if (typeof p.url === 'string' && p.url.trim().length > 0) {
            return normalizeS3ProfileUrl(p.url.trim());
          }
        }
      }
    }
  }

  // 3. Latest active images array entry
  if (Array.isArray(userOrVendor.images) && userOrVendor.images.length > 0) {
    for (let i = userOrVendor.images.length - 1; i >= 0; i -= 1) {
      const img = userOrVendor.images[i];
      if (img) {
        if (typeof img === 'string' && img.trim().length > 0) {
          return normalizeS3ProfileUrl(img.trim());
        }
        if (typeof img === 'object') {
          if (!img.isDeleted && !img.deleted && typeof img.url === 'string' && img.url.trim().length > 0) {
            return normalizeS3ProfileUrl(img.url.trim());
          }
          if (typeof img.url === 'string' && img.url.trim().length > 0) {
            return normalizeS3ProfileUrl(img.url.trim());
          }
        }
      }
    }
  }

  // 4. Fallback to profileImage field
  if (typeof userOrVendor.profileImage === 'string' && userOrVendor.profileImage.trim().length > 0) {
    return normalizeS3ProfileUrl(userOrVendor.profileImage.trim());
  }

  return null;
};
