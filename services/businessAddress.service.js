import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { BusinessAddress, User } from 'models';

export async function getBusinessAddressById(id, options = {}) {
  const businessAddress = await BusinessAddress.findById(id, options.projection, options);
  return businessAddress;
}

export async function getOne(query, options = {}) {
  const businessAddress = await BusinessAddress.findOne(query, options.projection, options);
  return businessAddress;
}

export async function getBusinessAddressList(filter, options = {}) {
  const businessAddress = await BusinessAddress.find(filter, options.projection, options);
  return businessAddress;
}

export async function getBusinessAddressListWithPagination(filter, options = {}) {
  const businessAddress = await BusinessAddress.paginate(filter, options);
  return businessAddress;
}

export async function createBusinessAddress(body) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const businessAddress = await BusinessAddress.create(body);
  return businessAddress;
}

export async function updateBusinessAddress(filter, body, options = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  const businessAddress = await BusinessAddress.findOneAndUpdate(filter, body, options);
  return businessAddress;
}

export async function updateManyBusinessAddress(filter, body, options = {}) {
  const businessAddress = await BusinessAddress.updateMany(filter, body, options);
  return businessAddress;
}

export async function removeBusinessAddress(filter) {
  const businessAddress = await BusinessAddress.findOneAndRemove(filter);
  return businessAddress;
}

export async function removeManyBusinessAddress(filter) {
  const businessAddress = await BusinessAddress.deleteMany(filter);
  return businessAddress;
}

export async function aggregateBusinessAddress(query) {
  const businessAddress = await BusinessAddress.aggregate(query);
  return businessAddress;
}

export async function aggregateBusinessAddressWithPagination(query, options = {}) {
  const aggregate = BusinessAddress.aggregate();
  query.forEach((obj) => {
    aggregate._pipeline.push(obj);
  });
  const businessAddress = await BusinessAddress.aggregatePaginate(aggregate, options);
  return businessAddress;
}
