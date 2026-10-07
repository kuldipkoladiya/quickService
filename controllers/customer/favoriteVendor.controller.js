/**
 * Customer Favorite Vendor Controller
 */
import httpStatus from 'http-status';
import { favoriteVendorService } from 'services';
import { catchAsync } from 'utils/catchAsync';
import ApiError from 'utils/ApiError';

export const getFavoriteVendor = catchAsync(async (req, res) => {
  const { favoriteVendorId } = req.params;
  const filter = {
    _id: favoriteVendorId,
    userId: req.user._id,
  };
  const options = {};
  const favoriteVendor = await favoriteVendorService.getOne(filter, options);
  if (!favoriteVendor) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Favorite vendor record not found');
  }
  return res.status(httpStatus.OK).send({ results: favoriteVendor });
});

export const listFavoriteVendor = catchAsync(async (req, res) => {
  const { page, limit, latitude, longitude, lat, lng } = req.query;
  const options = {
    page,
    limit,
    latitude: latitude || lat,
    longitude: longitude || lng,
    isPaginated: Boolean(page || limit),
  };
  const response = await favoriteVendorService.getCustomerFavoriteVendorList(req.user._id, options, req.user);
  return res.status(httpStatus.OK).send(response);
});

export const paginateFavoriteVendor = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, latitude, longitude, lat, lng } = req.query;
  const options = {
    page,
    limit,
    latitude: latitude || lat,
    longitude: longitude || lng,
    isPaginated: true,
  };
  const response = await favoriteVendorService.getCustomerFavoriteVendorList(req.user._id, options, req.user);
  return res.status(httpStatus.OK).send(response);
});

export const createFavoriteVendor = catchAsync(async (req, res) => {
  const targetVendorId = req.body.vendorId || req.body.vendorUserId;
  if (!targetVendorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'vendorId or vendorUserId is required in body');
  }
  const favoriteVendor = await favoriteVendorService.addFavoriteVendor(req.user._id, targetVendorId);
  return res.status(httpStatus.CREATED).send({
    message: 'Vendor added to favorites successfully',
    isFavorite: true,
    results: favoriteVendor,
  });
});

export const updateFavoriteVendor = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user._id;
  const { favoriteVendorId } = req.params;
  const filter = {
    _id: favoriteVendorId,
    userId: req.user._id,
  };
  const options = { new: true };
  const favoriteVendor = await favoriteVendorService.updateFavoriteVendor(filter, body, options);
  return res.status(httpStatus.OK).send({ results: favoriteVendor });
});

export const removeFavoriteVendor = catchAsync(async (req, res) => {
  const targetId =
    req.params.favoriteVendorId ||
    req.params.vendorId ||
    req.body?.vendorId ||
    req.body?.favoriteVendorId ||
    req.query?.vendorId;

  if (!targetId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'favoriteVendorId or vendorId is required');
  }
  const result = await favoriteVendorService.removeCustomerFavoriteVendor(req.user._id, targetId);
  return res.status(httpStatus.OK).send({
    message: 'Vendor removed from favorites successfully',
    isFavorite: false,
    results: result,
  });
});

export const removeFavoriteByVendorId = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const result = await favoriteVendorService.removeCustomerFavoriteVendor(req.user._id, vendorId);
  return res.status(httpStatus.OK).send({
    message: 'Vendor removed from favorites successfully',
    isFavorite: false,
    results: result,
  });
});

export const toggleFavoriteVendor = catchAsync(async (req, res) => {
  const targetVendorId = req.body.vendorId || req.body.vendorUserId;
  if (!targetVendorId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'vendorId or vendorUserId is required in body');
  }
  const result = await favoriteVendorService.toggleCustomerFavoriteVendor(req.user._id, targetVendorId);
  return res.status(httpStatus.OK).send(result);
});

export const checkFavoriteVendor = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const isFavorite = await favoriteVendorService.checkIsVendorFavorite(req.user._id, vendorId);
  return res.status(httpStatus.OK).send({
    vendorId,
    isFavorite,
  });
});
