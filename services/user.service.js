import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { User } from 'models';
import bcrypt from 'bcryptjs';
import { notificationService } from './index';

export async function getUserById(id, options = {}) {
  const user = await User.findById(id, options.projection, options);
  return user;
}

export async function getOne(query, options = {}) {
  const user = await User.findOne(query, options.projection, options);
  return user;
}
export async function updateUserForAuth(filter, body, options = {}, user) {
  // --- Check email uniqueness ---
  if (body.email && (await User.findOne({ email: body.email, _id: { $ne: user._id } }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // --- Hash password if provided ---
  if (body && body.password) {
    // eslint-disable-next-line no-param-reassign,no-undef
    body.password = await bcrypt.hash(body.password, 10);
  }

  // --- Update user ---
  await User.updateOne(filter, body, options);
  return getOne(filter);
}
export async function getUserList(filter, options = {}) {
  const user = await User.find(filter, options.projection, options);
  return user;
}

export async function getUserListWithPagination(filter, options = {}) {
  const user = await User.paginate(filter, options);
  return user;
}

export async function createUser(body = {}) {
  // if (await User.isEmailTaken(body.email)) {
  //   throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  // }
  const user = await User.create(body);
  return user;
}

export async function updateUser(filter, body, options = {}) {
  const userData = await getOne(filter, {});
  if (!userData) {
    throw new ApiError(httpStatus.NOT_FOUND, 'user not found');
  }
  if (body.email && (await User.isEmailTaken(body.email, userData.id))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const user = await User.findOneAndUpdate(filter, body, options);
  return user;
}

export async function updateManyUser(filter, body, options = {}) {
  const user = await User.updateMany(filter, body, options);
  return user;
}

export async function removeUser(filter) {
  const user = await User.findOneAndRemove(filter);
  return user;
}

export async function removeManyUser(filter) {
  const user = await User.deleteMany(filter);
  return user;
}

export async function aggregateUser(query) {
  const user = await User.aggregate(query);
  return user;
}

export async function aggregateUserWithPagination(query, options = {}) {
  const aggregate = User.aggregate();
  // eslint-disable-next-line array-callback-return
  query.map((obj) => {
    aggregate._pipeline.push(obj);
  });
  const user = await User.aggregatePaginate(aggregate, options);
  return user;
}

export async function addDeviceToken(user, body) {
  const { deviceToken, platform = 'android' } = body;
  if (!deviceToken) {
    return user;
  }
  const normalizedPlatform = (platform || 'android').toLowerCase();
  const isFCMValid = await notificationService.verifyFCMToken(deviceToken);
  if (!isFCMValid) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'The FCM Token is invalid!');
  }

  const existingTokens = user.deviceTokens || [];
  const existingTokenIndex = existingTokens.findIndex((dt) => dt && dt.deviceToken === deviceToken);

  if (existingTokenIndex !== -1) {
    // Update platform if changed
    if (normalizedPlatform && existingTokens[existingTokenIndex].platform !== normalizedPlatform) {
      existingTokens[existingTokenIndex].platform = normalizedPlatform;
      await User.updateOne({ _id: user._id }, { $set: { deviceTokens: existingTokens } });
    }
    return getOne({ _id: user._id });
  }

  // Add new device token
  await User.updateOne(
    { _id: user._id },
    {
      $addToSet: {
        deviceTokens: { deviceToken, platform: normalizedPlatform },
      },
    }
  );

  return getOne({ _id: user._id });
}

export async function removeDeviceToken(user, deviceToken) {
  if (!deviceToken || !user) {
    return user;
  }
  await User.updateOne(
    { _id: user._id },
    {
      $pull: {
        deviceTokens: { deviceToken },
      },
    }
  );
  return getOne({ _id: user._id });
}
