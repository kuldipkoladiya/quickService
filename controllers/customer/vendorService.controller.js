import httpStatus from 'http-status';
import { vendorServiceService, servicesService, vendorUserService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getVendorService = catchAsync(async (req, res) => {
  const { vendorServiceId } = req.params;
  const filter = {
    _id: vendorServiceId,
  };
  const options = {};
  const vendorService = await vendorServiceService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: vendorService });
});

export const listVendorService = catchAsync(async (req, res) => {
  const { vendorId, userId } = req.query;
  const filter = {};

  if (vendorId) {
    filter.vendorId = vendorId;
  } else if (userId) {
    const vendorUser = await vendorUserService.getOne({ userId });
    if (vendorUser) {
      filter.vendorId = vendorUser._id;
    } else {
      return res.status(httpStatus.OK).send({ results: [] });
    }
  }

  const options = {};
  const vendorService = await vendorServiceService.getVendorServiceList(filter, options);
  return res.status(httpStatus.OK).send({ results: vendorService });
});

export const paginateVendorService = catchAsync(async (req, res) => {
  const { vendorId, userId, page, limit } = req.query;
  const filter = {};

  if (vendorId) {
    filter.vendorId = vendorId;
  } else if (userId) {
    const vendorUser = await vendorUserService.getOne({ userId });
    if (vendorUser) {
      filter.vendorId = vendorUser._id;
    } else {
      return res.status(httpStatus.OK).send({
        results: {
          docs: [],
          totalDocs: 0,
          limit: parseInt(limit, 10) || 10,
          page: parseInt(page, 10) || 1,
          totalPages: 0,
        },
      });
    }
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const options = { page: pageNum, limit: limitNum };
  const vendorService = await vendorServiceService.getVendorServiceListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: vendorService });
});

export const createVendorService = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user._id;
  body.updatedBy = req.user._id;
  const options = {};
  const vendorService = await vendorServiceService.createVendorService(body, options);
  return res.status(httpStatus.CREATED).send({ results: vendorService });
});

export const updateVendorService = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { vendorServiceId } = req.params;
  const filter = {
    _id: vendorServiceId,
  };
  const options = { new: true };
  const vendorService = await vendorServiceService.updateVendorService(filter, body, options);
  return res.status(httpStatus.OK).send({ results: vendorService });
});

export const removeVendorService = catchAsync(async (req, res) => {
  const { vendorServiceId } = req.params;
  const filter = {
    _id: vendorServiceId,
  };
  const vendorService = await vendorServiceService.removeVendorService(filter);
  return res.status(httpStatus.OK).send({ results: vendorService });
});

export const getVendorServicesByCategory = catchAsync(async (req, res) => {
  const { categoryId } = req.params;
  const { latitude, longitude, page, limit } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;

  if (latitude && longitude) {
    const results = await vendorServiceService.getNearVendorServicesByCategory(longitude, latitude, categoryId, {
      page: pageNum,
      limit: limitNum,
    });
    return res.status(httpStatus.OK).send({ results });
  }

  const filter = { categoryId };
  const results = await vendorServiceService.getVendorServiceListWithPagination(filter, { page: pageNum, limit: limitNum });
  return res.status(httpStatus.OK).send({ results });
});
