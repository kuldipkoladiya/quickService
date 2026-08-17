import httpStatus from 'http-status';
import { VendorUser } from 'models';
import { vendorAvailabilityService } from 'services';
import { catchAsync } from 'utils/catchAsync';

export const getVendorAvailability = catchAsync(async (req, res) => {
  const { vendorAvailabilityId } = req.params;
  const filter = {
    _id: vendorAvailabilityId,
  };
  const options = {};
  const vendorAvailability = await vendorAvailabilityService.getOne(filter, options);
  return res.status(httpStatus.OK).send({ results: vendorAvailability });
});

export const listVendorAvailability = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const vendorAvailability = await vendorAvailabilityService.getVendorAvailabilityList(filter, options);
  return res.status(httpStatus.OK).send({ results: vendorAvailability });
});

export const paginateVendorAvailability = catchAsync(async (req, res) => {
  const filter = {};
  const options = {};
  const vendorAvailability = await vendorAvailabilityService.getVendorAvailabilityListWithPagination(filter, options);
  return res.status(httpStatus.OK).send({ results: vendorAvailability });
});

export const createVendorAvailability = catchAsync(async (req, res) => {
  const { body } = req;
  body.createdBy = req.user._id;
  body.updatedBy = req.user._id;
  const options = {};
  const vendorAvailability = await vendorAvailabilityService.createVendorAvailability(body, options);
  return res.status(httpStatus.CREATED).send({ results: vendorAvailability });
});

export const updateVendorAvailability = catchAsync(async (req, res) => {
  const { body } = req;
  body.updatedBy = req.user;
  const { vendorAvailabilityId } = req.params;
  const filter = {
    _id: vendorAvailabilityId,
  };
  const options = { new: true };
  const vendorAvailability = await vendorAvailabilityService.updateVendorAvailability(filter, body, options);
  return res.status(httpStatus.OK).send({ results: vendorAvailability });
});

export const removeVendorAvailability = catchAsync(async (req, res) => {
  const { vendorAvailabilityId } = req.params;
  const filter = {
    _id: vendorAvailabilityId,
  };
  const vendorAvailability = await vendorAvailabilityService.removeVendorAvailability(filter);
  return res.status(httpStatus.OK).send({ results: vendorAvailability });
});

function sanitizeVendorAvailabilityResponse(availability) {
  if (!availability) return null;
  const obj = availability.toJSON ? availability.toJSON() : { ...availability };
  if (obj.weeklySchedule && Array.isArray(obj.weeklySchedule)) {
    obj.weeklySchedule = obj.weeklySchedule.map((item) => ({
      day: item.day,
      isOpen: item.isOpen !== undefined ? item.isOpen : true,
    }));
  }
  return obj;
}

export const getMyAvailability = catchAsync(async (req, res) => {
  let vendorId = req.user._id;
  const vendorUser = await VendorUser.findOne({ userId: req.user._id, isDeleted: { $ne: true } });
  if (vendorUser) {
    vendorId = vendorUser._id;
  }

  let availability = await vendorAvailabilityService.getOne({ vendorId, isDeleted: { $ne: true } });
  if (!availability) {
    // Create/return default availability
    availability = await vendorAvailabilityService.upsertVendorAvailability(vendorId, {}, req.user._id);
  }
  return res.status(httpStatus.OK).send({ results: sanitizeVendorAvailabilityResponse(availability) });
});

export const saveMyAvailability = catchAsync(async (req, res) => {
  const { body } = req;
  let vendorId = req.user._id;
  const vendorUser = await VendorUser.findOne({ userId: req.user._id, isDeleted: { $ne: true } });
  if (vendorUser) {
    vendorId = vendorUser._id;
  }

  const availability = await vendorAvailabilityService.upsertVendorAvailability(vendorId, body, req.user._id);
  return res.status(httpStatus.OK).send({ results: sanitizeVendorAvailabilityResponse(availability) });
});
