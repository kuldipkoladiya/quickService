import mongoose from 'mongoose';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Bookings, User, VendorUser, Services, VendorService, Address, BusinessAddress, VendorAvailability } from 'models';
import { EnumStatusOfBookings } from 'models/enum.model';
import { calculateVisitCharges } from './vendorUser.service';

export async function getBookingsById(id, options = {}) {
  const bookings = await Bookings.findById(id, options.projection, options);
  return bookings;
}

function calculateDistanceInKm(lat1, lon1, lat2, lon2) {
  if (
    lat1 === undefined ||
    lat1 === null ||
    lon1 === undefined ||
    lon1 === null ||
    lat2 === undefined ||
    lat2 === null ||
    lon2 === undefined ||
    lon2 === null
  ) {
    return null;
  }
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getVendorVisitCharge(vendorUser, distanceKm = null) {
  let visitCharges = vendorUser && vendorUser.visitCharges;
  if (!visitCharges || !Array.isArray(visitCharges) || visitCharges.length === 0) {
    const radius = (vendorUser && vendorUser.serviceRadius) || 15;
    visitCharges = calculateVisitCharges(radius);
  }

  if (distanceKm !== null && distanceKm !== undefined && Array.isArray(visitCharges) && visitCharges.length > 0) {
    const matched = visitCharges.find((vc) => distanceKm >= vc.minDistance && distanceKm <= vc.maxDistance);
    if (matched && matched.charge !== undefined && matched.charge !== null) {
      return matched.charge;
    }
  }

  if (Array.isArray(visitCharges) && visitCharges.length > 0 && visitCharges[0] && visitCharges[0].charge) {
    return visitCharges[0].charge;
  }
  return 100;
}

export async function getBookingSummaryDetails(identifier) {
  let filter = {};
  if (typeof identifier === 'object' && identifier !== null && !Array.isArray(identifier)) {
    filter = identifier;
  } else if (mongoose.Types.ObjectId.isValid(identifier)) {
    filter = { $or: [{ _id: identifier }, { bookingId: identifier }] };
  } else {
    filter = { bookingId: identifier };
  }

  const booking = await Bookings.findOne(filter)
    .populate({
      path: 'vendorId',
      populate: [
        {
          path: 'userId',
          select: 'name fullName email mobileNumber profileImage profilePic userProfilePic location images',
        },
        { path: 'categoryId', select: 'name title image' },
      ],
    })
    .populate('customerId', 'name fullName email mobileNumber profileImage profilePic userProfilePic')
    .populate('addressId')
    .populate('vendorServiceId')
    .populate('serviceIds');

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Booking not found');
  }

  // Format Vendor info for UI
  const vendorUserObj = booking.vendorId || {};
  const vendorUserAccount = vendorUserObj.userId || {};

  // Get Vendor's business address
  let vendorBusinessAddress = null;
  if (booking.vendorId) {
    const vendorUserId = (booking.vendorId.userId && booking.vendorId.userId._id) || booking.vendorId.userId;
    vendorBusinessAddress = await BusinessAddress.findOne({
      userId: vendorUserId,
      isDeleted: { $ne: true },
    });
  }

  // Calculate distance if coordinates are available
  let distanceKm = null;
  if (
    booking.latitude &&
    booking.longitude &&
    vendorUserAccount.location &&
    Array.isArray(vendorUserAccount.location.coordinates)
  ) {
    const [lon2, lat2] = vendorUserAccount.location.coordinates;
    distanceKm = calculateDistanceInKm(booking.latitude, booking.longitude, lat2, lon2);
  }

  // Find all vendor services for this vendor and selected serviceIds
  const queryConditions = [];
  if (booking.vendorServiceId) {
    const vsId = booking.vendorServiceId._id || booking.vendorServiceId;
    queryConditions.push({ _id: vsId });
  }
  if (booking.vendorId && booking.serviceIds && Array.isArray(booking.serviceIds) && booking.serviceIds.length > 0) {
    const sIds = booking.serviceIds.map((s) => (s._id ? s._id : s));
    const vId = booking.vendorId._id || booking.vendorId;
    queryConditions.push({ vendorId: vId, serviceId: { $in: sIds } });
  }

  let vendorServicesList = [];
  if (queryConditions.length > 0) {
    vendorServicesList = await VendorService.find({
      $or: queryConditions,
      isDeleted: { $ne: true },
    }).populate('serviceId');
  }

  // Extract service breakdown
  const serviceDetails = [];
  let calculatedServicesTotal = 0;
  let fixedServicesTotal = 0;
  let hasVisitingService = false;
  const processedServiceIds = new Set();
  const singleVisitCharge = getVendorVisitCharge(vendorUserObj, distanceKm);

  // eslint-disable-next-line no-restricted-syntax
  for (const vs of vendorServicesList) {
    const sId = vs.serviceId && vs.serviceId._id ? vs.serviceId._id.toString() : vs._id.toString();
    if (!processedServiceIds.has(sId)) {
      processedServiceIds.add(sId);
      const rawTitle = (vs.serviceId && vs.serviceId.title) || vs.title || 'Service';
      const pricingType = vs.pricingType || 'fixed';

      let itemPrice = 0;
      if (pricingType === 'fixed') {
        itemPrice = vs.price !== undefined && vs.price !== null ? vs.price : 0;
        fixedServicesTotal += itemPrice;
      } else if (pricingType === 'visiting') {
        hasVisitingService = true;
        itemPrice = singleVisitCharge;
      }

      serviceDetails.push({
        vendorServiceId: vs._id,
        serviceId: vs.serviceId ? vs.serviceId._id : null,
        title: rawTitle.endsWith('Fee') ? rawTitle : `${rawTitle} Fee`,
        rawTitle,
        pricingType,
        price: itemPrice,
      });
    }
  }

  // Calculate services total and subtotal according to pricing type
  if (fixedServicesTotal > 0) {
    calculatedServicesTotal = fixedServicesTotal;
  } else if (hasVisitingService || vendorUserObj) {
    calculatedServicesTotal = singleVisitCharge;
  }

  let calculatedSubtotal = 0;
  if (fixedServicesTotal > 0) {
    calculatedSubtotal = fixedServicesTotal + (hasVisitingService ? singleVisitCharge : 0);
  } else if (hasVisitingService || vendorUserObj) {
    calculatedSubtotal = singleVisitCharge;
  }

  // If no vendorServices were matched but serviceIds exists, extract directly from serviceIds
  if (
    serviceDetails.length === 0 &&
    booking.serviceIds &&
    Array.isArray(booking.serviceIds) &&
    booking.serviceIds.length > 0
  ) {
    // eslint-disable-next-line no-restricted-syntax
    for (const s of booking.serviceIds) {
      const rawTitle = s.title || 'Service';
      serviceDetails.push({
        vendorServiceId: booking.vendorServiceId ? booking.vendorServiceId._id || booking.vendorServiceId : null,
        serviceId: s._id || s,
        title: rawTitle.endsWith('Fee') ? rawTitle : `${rawTitle} Fee`,
        rawTitle,
        pricingType: 'visiting',
        price: singleVisitCharge,
      });
    }
    calculatedServicesTotal = singleVisitCharge;
    calculatedSubtotal = singleVisitCharge;
  }

  // If still empty fallback
  if (serviceDetails.length === 0) {
    serviceDetails.push({
      vendorServiceId: booking.vendorServiceId ? booking.vendorServiceId._id || booking.vendorServiceId : null,
      serviceId: booking.serviceId || null,
      title: 'Visiting Fee',
      rawTitle: 'Visiting Service',
      pricingType: 'visiting',
      price: singleVisitCharge,
    });
    calculatedServicesTotal = singleVisitCharge;
    calculatedSubtotal = singleVisitCharge;
  }

  const subtotal = booking.subtotal ? booking.subtotal : calculatedSubtotal;
  const visitingCharge = hasVisitingService ? singleVisitCharge : 0;
  const serviceFee =
    booking.serviceFee !== undefined && booking.serviceFee > 0
      ? booking.serviceFee
      : Math.round(subtotal * 0.05 * 100) / 100;
  const tax = booking.tax !== undefined && booking.tax > 0 ? booking.tax : Math.round(subtotal * 0.05 * 100) / 100;
  const totalPayable =
    booking.totalAmount !== undefined && booking.totalAmount > 0
      ? booking.totalAmount
      : Math.round((subtotal + serviceFee + tax) * 100) / 100;

  // Format Vendor info for UI
  const vendorName =
    vendorUserObj.businessName || vendorUserAccount.fullName || vendorUserAccount.name || 'Star Unisex Saloon';
  const vendorRating = vendorUserObj.rating || 4.5;
  const vendorTotalReviews = vendorUserObj.totalReviews || 0;
  const vendorIsVerified = Boolean(vendorUserObj.isKycVerified);

  let vendorLocation = vendorUserAccount.location || 'Gandhinagar, Gujarat';
  if (vendorBusinessAddress) {
    const parts = [vendorBusinessAddress.city, vendorBusinessAddress.state].filter(Boolean);
    if (parts.length > 0) vendorLocation = parts.join(', ');
  }

  const vendorImages =
    vendorUserAccount.images && vendorUserAccount.images.length > 0 ? vendorUserAccount.images.map((img) => img.url) : [];

  const userProfilePicUrl =
    (vendorUserAccount.userProfilePic &&
      vendorUserAccount.userProfilePic.length > 0 &&
      vendorUserAccount.userProfilePic[0].url) ||
    null;

  const vendorProfilePic =
    vendorUserAccount.profilePic || vendorUserAccount.profileImage || userProfilePicUrl || vendorImages[0] || null;

  // Format Address for UI
  const addressObj = booking.addressId || {};
  const formattedCustomerAddress = addressObj.address
    ? `${addressObj.floor ? `${addressObj.floor}, ` : ''}${addressObj.address}${
        addressObj.landmark ? `, ${addressObj.landmark}` : ''
      }${addressObj.location ? `, ${addressObj.location}` : ''}`
    : '12-02, Star Building, Sector 4C, Gandhinagar';

  const bookingSummary = {
    bookingId: booking.bookingId,
    _id: booking._id,
    status: booking.status,
    paymentStatus: booking.paymentStatus || 'panding',
    vendor: {
      vendorId: vendorUserObj._id,
      businessName: vendorName,
      rating: vendorRating,
      totalReviews: vendorTotalReviews,
      isVerified: vendorIsVerified,
      location: vendorLocation,
      profilePic: vendorProfilePic,
      profileImage: vendorProfilePic,
      category: vendorUserObj.categoryId ? vendorUserObj.categoryId.name || vendorUserObj.categoryId.title : null,
      businessAddress: vendorBusinessAddress,
    },
    appointment: {
      bookingType: booking.bookingType || 'schedule',
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime || 'Select Day & Time',
      timeSlot: booking.timeSlot || booking.bookingTime,
      estimatedArrival: booking.estimatedArrival,
      serviceStartTime: booking.serviceStartTime,
      serviceEndTime: booking.serviceEndTime,
    },
    customerAddress: {
      addressId: addressObj._id,
      address: addressObj.address,
      floor: addressObj.floor,
      landmark: addressObj.landmark,
      locationType: addressObj.locationType,
      receiverName: addressObj.receiverName,
      receiverMobile: addressObj.receiverMobile,
      location: addressObj.location,
      displayAddress: formattedCustomerAddress,
    },
    priceBreakdown: {
      services: serviceDetails,
      servicesTotal: calculatedServicesTotal,
      visitingCharge,
      subtotal,
      serviceFee,
      serviceFeePercentage: '5%',
      tax,
      taxPercentage: '5%',
      totalPayable,
    },
    notes: booking.notes,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
  };

  return {
    booking: booking.toJSON ? booking.toJSON() : booking,
    bookingSummary,
  };
}

export async function getOne(query, options = {}) {
  const bookings = await Bookings.findOne(query, options.projection, options);
  return bookings;
}

export async function getBookingsList(filter, options = {}) {
  const bookings = await Bookings.find(filter, options.projection, options);
  return bookings;
}

export async function getBookingsListWithPagination(filter, options = {}) {
  const bookings = await Bookings.paginate(filter, options);
  return bookings;
}

function formatTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  hours = hours || 12;
  minutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutes} ${ampm}`;
}

async function generateUniqueBookingId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let isUnique = false;
  let bookingId = '';
  while (!isUnique) {
    bookingId = '';
    for (let i = 0; i < 8; i += 1) {
      bookingId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    // eslint-disable-next-line no-await-in-loop
    const existing = await Bookings.findOne({ bookingId });
    if (!existing) {
      isUnique = true;
    }
  }
  return bookingId;
}

export async function createBookings(body = {}) {
  // Automatically generate unique 8-character bookingId if not provided
  if (!body.bookingId) {
    // eslint-disable-next-line no-param-reassign
    body.bookingId = await generateUniqueBookingId();
  }

  // Automatically default bookingDate and bookingTime to current if not provided
  const now = new Date();
  if (!body.bookingDate) {
    // eslint-disable-next-line no-param-reassign
    body.bookingDate = now;
  } else {
    // eslint-disable-next-line no-param-reassign
    body.bookingDate = new Date(body.bookingDate);
  }

  let vendorAvailability = null;
  if (body.vendorId) {
    vendorAvailability = await VendorAvailability.findOne({ vendorId: body.vendorId, isDeleted: { $ne: true } });
  }

  // Automatically determine booking type & scheduling details from BE
  if (body.timeSlot || body.bookingType === 'schedule') {
    // eslint-disable-next-line no-param-reassign
    body.bookingType = 'schedule';
    // eslint-disable-next-line no-param-reassign
    body.bookingTime = body.timeSlot || body.bookingTime || formatTime(now);
  } else {
    // Vendor is on instant visit or default
    // eslint-disable-next-line no-param-reassign
    body.bookingType = (vendorAvailability && vendorAvailability.bookingOption) || 'instant';
    // eslint-disable-next-line no-param-reassign
    body.bookingTime = body.bookingTime || formatTime(now);
    if (body.bookingType === 'instant' && !body.estimatedArrival) {
      // eslint-disable-next-line no-param-reassign
      body.estimatedArrival = (vendorAvailability && vendorAvailability.instantArrivalEstimate) || '30-40 mins';
    }
  }

  if (!body.status) {
    // eslint-disable-next-line no-param-reassign
    body.status = EnumStatusOfBookings.PANDING;
  }

  if (body.customerId) {
    const customerId = await User.findOne({ _id: body.customerId });
    if (!customerId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field customerId is not valid');
    }
  }
  if (body.vendorId) {
    const vendorId = await VendorUser.findOne({ _id: body.vendorId });
    if (!vendorId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field vendorId is not valid');
    }
  }
  if (body.serviceId) {
    const serviceId = await Services.findOne({ _id: body.serviceId });
    if (!serviceId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field serviceId is not valid');
    }
  }
  if (body.vendorServiceId) {
    const vendorServiceId = await VendorService.findOne({ _id: body.vendorServiceId });
    if (!vendorServiceId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field vendorServiceId is not valid');
    }
  }
  if (body.addressId) {
    const addressId = await Address.findOne({ _id: body.addressId });
    if (!addressId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field addressId is not valid');
    }
  }

  // Verify multiple vendorServiceIds if passed
  if (body.vendorServiceIds && Array.isArray(body.vendorServiceIds)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const vsId of body.vendorServiceIds) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await VendorService.findOne({ _id: vsId });
      if (!exists) {
        throw new ApiError(httpStatus.BAD_REQUEST, `vendorServiceId ${vsId} is not valid`);
      }
    }
  }

  // Verify multiple serviceIds if passed
  if (body.serviceIds && Array.isArray(body.serviceIds)) {
    // eslint-disable-next-line no-restricted-syntax
    for (const sId of body.serviceIds) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await Services.findOne({ _id: sId });
      if (!exists) {
        throw new ApiError(httpStatus.BAD_REQUEST, `serviceId ${sId} is not valid`);
      }
    }
  }

  // Auto-calculate pricing fields directly from selected services
  const queryConditions = [];
  if (body.vendorServiceId) {
    queryConditions.push({ _id: body.vendorServiceId });
  }
  if (body.vendorServiceIds && Array.isArray(body.vendorServiceIds)) {
    queryConditions.push({ _id: { $in: body.vendorServiceIds } });
  }
  if (body.vendorId && body.serviceIds && Array.isArray(body.serviceIds) && body.serviceIds.length > 0) {
    queryConditions.push({ vendorId: body.vendorId, serviceId: { $in: body.serviceIds } });
  }

  let vendorServices = [];
  if (queryConditions.length > 0) {
    vendorServices = await VendorService.find({
      $or: queryConditions,
      isDeleted: { $ne: true },
    });
  }

  let vendorUserDoc = null;
  if (body.vendorId) {
    vendorUserDoc = await VendorUser.findById(body.vendorId).populate('userId');
  }

  // Calculate distance if coordinates are passed
  let distanceKm = null;
  if (
    body.latitude &&
    body.longitude &&
    vendorUserDoc &&
    vendorUserDoc.userId &&
    vendorUserDoc.userId.location &&
    Array.isArray(vendorUserDoc.userId.location.coordinates)
  ) {
    const [lon2, lat2] = vendorUserDoc.userId.location.coordinates;
    distanceKm = calculateDistanceInKm(body.latitude, body.longitude, lat2, lon2);
  }

  let subtotal = 0;
  let fixedServicesTotal = 0;
  let hasVisitingService = false;

  // eslint-disable-next-line no-restricted-syntax
  for (const vs of vendorServices) {
    if (vs.pricingType === 'fixed') {
      fixedServicesTotal += vs.price !== undefined && vs.price !== null ? vs.price : 0;
    } else if (vs.pricingType === 'visiting') {
      hasVisitingService = true;
    }
  }

  const singleVisitCharge = getVendorVisitCharge(vendorUserDoc, distanceKm);

  if (fixedServicesTotal > 0) {
    subtotal = fixedServicesTotal + (hasVisitingService ? singleVisitCharge : 0);
  } else if (hasVisitingService || vendorUserDoc) {
    subtotal = singleVisitCharge;
  }

  // eslint-disable-next-line no-param-reassign
  body.subtotal = subtotal;
  // eslint-disable-next-line no-param-reassign
  body.serviceFee = Math.round(subtotal * 0.05 * 100) / 100; // 5% service fee
  // eslint-disable-next-line no-param-reassign
  body.tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% taxes
  // eslint-disable-next-line no-param-reassign
  body.totalAmount = Math.round((body.subtotal + body.serviceFee + body.tax) * 100) / 100;

  const bookings = await Bookings.create(body);
  return bookings;
}

export async function updateBookings(filter, body, options = {}) {
  if (body.customerId) {
    const customerId = await User.findOne({ _id: body.customerId });
    if (!customerId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field customerId is not valid');
    }
  }
  if (body.vendorId) {
    const vendorId = await VendorUser.findOne({ _id: body.vendorId });
    if (!vendorId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field vendorId is not valid');
    }
  }
  if (body.serviceId) {
    const serviceId = await Services.findOne({ _id: body.serviceId });
    if (!serviceId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field serviceId is not valid');
    }
  }
  if (body.vendorServiceId) {
    const vendorServiceId = await VendorService.findOne({ _id: body.vendorServiceId });
    if (!vendorServiceId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field vendorServiceId is not valid');
    }
  }
  if (body.addressId) {
    const addressId = await Address.findOne({ _id: body.addressId });
    if (!addressId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field addressId is not valid');
    }
  }
  const bookings = await Bookings.findOneAndUpdate(filter, body, options);
  return bookings;
}

export async function updateManyBookings(filter, body, options = {}) {
  const bookings = await Bookings.updateMany(filter, body, options);
  return bookings;
}

export async function removeBookings(filter) {
  const bookings = await Bookings.findOneAndRemove(filter);
  return bookings;
}

export async function removeManyBookings(filter) {
  const bookings = await Bookings.deleteMany(filter);
  return bookings;
}

export async function aggregateBookings(query) {
  const bookings = await Bookings.aggregate(query);
  return bookings;
}

// export async function aggregateBookingsWithPagination(query, options = {}) {
//   const aggregate = Bookings.aggregate();
//   query.map((obj) => {
//     aggregate._pipeline.push(obj);
//   });
//   const bookings = await Bookings.aggregatePaginate(aggregate, options);
//   return bookings;
// }
