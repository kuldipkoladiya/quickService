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

export const getVendorSlots = catchAsync(async (req, res) => {
  const { vendorId } = req.params;
  const days = parseInt(req.query.days, 10) || 7;

  let actualVendorId = vendorId;
  // If vendorId passed is the userId of vendor, find the VendorUser
  const vendorUser = await VendorUser.findOne({
    $or: [{ _id: vendorId }, { userId: vendorId }],
    isDeleted: { $ne: true },
  });

  if (vendorUser) {
    actualVendorId = vendorUser._id;
  }

  const slotData = await vendorAvailabilityService.getVendorAvailableSlots(actualVendorId, days);
  return res.status(httpStatus.OK).send({ results: slotData });
});

export const getVendorAvailabilityByVendorId = catchAsync(async (req, res) => {
  const { vendorId } = req.params;

  let actualVendorId = vendorId;
  const vendorUser = await VendorUser.findOne({
    $or: [{ _id: vendorId }, { userId: vendorId }],
    isDeleted: { $ne: true },
  });

  if (vendorUser) {
    actualVendorId = vendorUser._id;
  }

  let availability = await vendorAvailabilityService.getOne({ vendorId: actualVendorId, isDeleted: { $ne: true } });
  if (!availability) {
    availability = {
      vendorId: actualVendorId,
      isOnline: true,
      storeStatus: 'online',
      bookingOption: 'instant',
      instantArrivalEstimate: '30-40 mins',
      weeklySchedule: [],
    };
  }

  return res.status(httpStatus.OK).send({ results: availability });
});
