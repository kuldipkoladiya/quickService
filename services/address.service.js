import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Address, User } from 'models';

export async function getAddressById(id, options = {}) {
  const address = await Address.findById(id, options.projection, options);
  return address;
}

export async function getOne(query, options = {}) {
  const address = await Address.findOne(query, options.projection, options);
  return address;
}

export async function getAddressList(filter, options = {}) {
  const address = await Address.find(filter, options.projection, options);
  return address;
}

export async function getAddressListWithPagination(filter, options = {}) {
  const address = await Address.paginate(filter, options);
  return address;
}

export async function createAddress(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const isDefaultBool = body.isDefault === true || body.isDefault === 'true';
  if (isDefaultBool) {
    // eslint-disable-next-line no-param-reassign
    body.isDefault = true;
    if (body.userId) {
      await Address.updateMany({ userId: body.userId }, { $set: { isDefault: false } });
    }
  } else if (body.isDefault === false || body.isDefault === 'false') {
    // eslint-disable-next-line no-param-reassign
    body.isDefault = false;
  }
  const address = await Address.create(body);
  return address;
}

export async function updateAddress(filter, body, options = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const isDefaultBool = body.isDefault === true || body.isDefault === 'true';
  if (isDefaultBool) {
    // eslint-disable-next-line no-param-reassign
    body.isDefault = true;
    let userId = body.userId || filter.userId;
    if (!userId) {
      const existingAddress = await Address.findOne(filter);
      if (existingAddress) {
        userId = existingAddress.userId;
      }
    }
    if (userId) {
      await Address.updateMany({ userId }, { $set: { isDefault: false } });
    }
  } else if (body.isDefault === false || body.isDefault === 'false') {
    // eslint-disable-next-line no-param-reassign
    body.isDefault = false;
  }
  const address = await Address.findOneAndUpdate(filter, body, options);
  return address;
}

export async function updateManyAddress(filter, body, options = {}) {
  const address = await Address.updateMany(filter, body, options);
  return address;
}

export async function removeAddress(filter) {
  const address = await Address.findOneAndRemove(filter);
  return address;
}

export async function removeManyAddress(filter) {
  const address = await Address.deleteMany(filter);
  return address;
}

export async function aggregateAddress(query) {
  const address = await Address.aggregate(query);
  return address;
}
//
// export async function aggregateAddressWithPagination(query, options = {}) {
//   const aggregate = Address.aggregate();
//   query.map((obj) => {
//     aggregate._pipeline.push(obj);
//   });
//   const address = await Address.aggregatePaginate(aggregate, options);
//   return address;
// }
