import httpStatus from 'http-status';
import { businessAddressService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getAddress = catchAsync(async (req, res) => {
  const { businessAddressId } = req.params;
  const filter = {
    _id: businessAddressId,
    userId: req.user._id,
  };
  const options = {};
  const businessAddress = await businessAddressService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: businessAddress });
});

export const listAddress = catchAsync(async (req, res) => {
  const filter = {
    userId: req.user._id,
  };
  const options = {};
  const businessAddress = await businessAddressService.getBusinessAddressList(filter, options);
  return res.status(httpStatus.OK).send({ results: businessAddress });
});

export const paginateAddress = catchAsync(async (req, res) => {
  const filter = {
    userId: req.user._id,
  };
  const options = {};
  const businessAddress = await businessAddressService.getBusinessAddressListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: businessAddress });
});

export const createAddress = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user._id;
  body.updatedBy = req.user._id;
  if (!body.userId) {
    body.userId = req.user._id;
  }
  const options = {};
  const businessAddress = await businessAddressService.createBusinessAddress(body, options);
  return res.status(httpStatus.CREATED).send({ results: businessAddress });
});

export const updateAddress = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { businessAddressId } = req.params;
  const filter = {
    _id: businessAddressId,
    userId: req.user._id,
  };
  const options = { new: true };
  const businessAddress = await businessAddressService.updateBusinessAddress(filter, body, options);
  return res.status(httpStatus.OK).send({ results: businessAddress });
});

export const removeAddress = catchAsync(async (req, res) => {
  const { businessAddressId } = req.params;
  const filter = {
    _id: businessAddressId,
    userId: req.user._id,
  };
  const businessAddress = await businessAddressService.removeBusinessAddress(filter);
  return res.status(httpStatus.OK).send({ results: businessAddress });
});
