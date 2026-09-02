import mongoose from 'mongoose';
import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import { Bookings, User, VendorUser, Services, VendorService, Address, VendorAvailability } from 'models';
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

export function formatTime(date = new Date()) {
  try {
    return new Date(date).toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    const d = new Date(date);
    let hours = d.getHours();
    let minutes = d.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours %= 12;
    hours = hours || 12;
    minutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${hours}:${minutes} ${ampm}`;
  }
}

export const defaultBookingPopulate = [
  {
    path: 'vendorId',
    populate: [
      {
        path: 'userId',
        select:
          'name fullName email mobileNumber profileImage profilePic userProfilePic location images countryCode businessName',
      },
      { path: 'categoryId', select: 'name title image' },
    ],
  },
  {
    path: 'customerId',
    select: 'name fullName email mobileNumber profileImage profilePic userProfilePic',
  },
  { path: 'addressId' },
  {
    path: 'vendorServiceId',
    populate: { path: 'serviceId', select: 'name title image' },
  },
  { path: 'serviceIds', select: 'name title image price' },
  { path: 'serviceId', select: 'name title image' },
];

export function extractProfilePic(userOrVendor) {
  if (!userOrVendor || typeof userOrVendor !== 'object') return null;

  // 1. Current active profilePic field (e.g. hapmeet-user-images)
  if (typeof userOrVendor.profilePic === 'string' && userOrVendor.profilePic.trim().length > 0) {
    return userOrVendor.profilePic.trim();
  }

  // 2. Latest active userProfilePic array entry
  if (Array.isArray(userOrVendor.userProfilePic) && userOrVendor.userProfilePic.length > 0) {
    for (let i = userOrVendor.userProfilePic.length - 1; i >= 0; i -= 1) {
      const p = userOrVendor.userProfilePic[i];
      if (p) {
        if (typeof p === 'string' && p.trim().length > 0) {
          return p.trim();
        }
        if (typeof p === 'object') {
          if (!p.isDeleted && !p.deleted && typeof p.url === 'string' && p.url.trim().length > 0) {
            return p.url.trim();
          }
          if (typeof p.url === 'string' && p.url.trim().length > 0) {
            return p.url.trim();
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
          return img.trim();
        }
        if (typeof img === 'object') {
          if (!img.isDeleted && !img.deleted && typeof img.url === 'string' && img.url.trim().length > 0) {
            return img.url.trim();
          }
          if (typeof img.url === 'string' && img.url.trim().length > 0) {
            return img.url.trim();
          }
        }
      }
    }
  }

  // 4. Fallback to profileImage field
  if (typeof userOrVendor.profileImage === 'string' && userOrVendor.profileImage.trim().length > 0) {
    return userOrVendor.profileImage.trim();
  }

  return null;
}

export function enrichBookingWithDetails(booking) {
  if (!booking) return booking;
  let b = booking;
  try {
    if (typeof booking.toJSON === 'function') {
      b = booking.toJSON();
    } else if (typeof booking.toObject === 'function') {
      b = booking.toObject();
    } else {
      b = { ...booking };
    }
  } catch (e) {
    b = { ...booking };
  }

  const customer = b.customerId && typeof b.customerId === 'object' ? b.customerId : {};
  const address = b.addressId && typeof b.addressId === 'object' ? b.addressId : {};
  const vendorObj = b._resolvedVendorUser || (b.vendorId && typeof b.vendorId === 'object' ? b.vendorId : {});
  let vendorUserAccount = b._resolvedUser || null;
  if (!vendorUserAccount) {
    if (vendorObj.userId && typeof vendorObj.userId === 'object') {
      vendorUserAccount = vendorObj.userId;
    } else if (b.vendorId && typeof b.vendorId === 'object' && b.vendorId.role === 'vendor') {
      vendorUserAccount = b.vendorId;
    } else {
      vendorUserAccount = {};
    }
  }

  // 1. Customer Name
  const customerName = customer.fullName || customer.name || address.receiverName || '';

  // 2. Vendor Details (Name, Business Name, Profile Pic, Mobile Number)
  let vendorName = '';
  let businessName = '';
  let mobileNumber = null;
  let countryCode = '+91';

  if (
    vendorUserAccount &&
    (vendorUserAccount.fullName ||
      vendorUserAccount.name ||
      vendorUserAccount.email ||
      vendorUserAccount.mobileNumber ||
      vendorUserAccount.businessName)
  ) {
    vendorName = vendorUserAccount.fullName || vendorUserAccount.name || '';
    businessName = vendorObj.businessName || vendorUserAccount.businessName || '';
    if (!vendorName && businessName) {
      vendorName = businessName;
    }
    mobileNumber =
      vendorUserAccount.mobileNumber !== undefined && vendorUserAccount.mobileNumber !== null
        ? vendorUserAccount.mobileNumber
        : vendorObj.mobileNumber || null;
    countryCode = vendorUserAccount.countryCode || vendorObj.countryCode || '+91';
  } else if (vendorObj && (vendorObj.businessName || vendorObj.fullName || vendorObj.name || vendorObj.mobileNumber)) {
    businessName = vendorObj.businessName || '';
    vendorName = vendorObj.fullName || vendorObj.name || businessName || '';
    mobileNumber = vendorObj.mobileNumber || null;
    countryCode = vendorObj.countryCode || '+91';
  }

  // Extract actual profile pic from user database document or vendor document (null if none exists)
  const profilePic = extractProfilePic(vendorUserAccount) || extractProfilePic(vendorObj) || null;

  const vendorIdVal =
    (vendorObj && (vendorObj._id || vendorObj.id)) ||
    (vendorUserAccount && (vendorUserAccount._id || vendorUserAccount.id)) ||
    (typeof b.vendorId === 'string' ? b.vendorId : null);

  const vendorData = {
    _id: vendorIdVal ? vendorIdVal.toString() : null,
    name: vendorName,
    businessName,
    profilePic,
    mobileNumber,
    countryCode,
    email: vendorUserAccount.email || vendorObj.email || null,
  };

  // 3. Service Name
  const serviceNameList = [];
  if (b.serviceIds && Array.isArray(b.serviceIds) && b.serviceIds.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const s of b.serviceIds) {
      if (typeof s === 'object' && s !== null) {
        const sName = s.name || s.title;
        if (sName && !serviceNameList.includes(sName)) {
          serviceNameList.push(sName);
        }
      }
    }
  }

  if (b.serviceId && typeof b.serviceId === 'object' && b.serviceId !== null) {
    const sName = b.serviceId.name || b.serviceId.title;
    if (sName && !serviceNameList.includes(sName)) {
      serviceNameList.push(sName);
    }
  }

  if (b.vendorServiceId && typeof b.vendorServiceId === 'object' && b.vendorServiceId !== null) {
    const vs = b.vendorServiceId;
    const vsName = (vs.serviceId && (vs.serviceId.name || vs.serviceId.title)) || vs.serviceName || vs.title;
    if (vsName && !serviceNameList.includes(vsName)) {
      serviceNameList.push(vsName);
    }
  }

  const serviceName = serviceNameList.length > 0 ? serviceNameList.join(', ') : b.serviceName || '';

  // 4. Distance in km
  let lat1 = null;
  let lon1 = null;
  if (
    address.latitude !== undefined &&
    address.latitude !== null &&
    address.longitude !== undefined &&
    address.longitude !== null
  ) {
    lat1 = Number(address.latitude);
    lon1 = Number(address.longitude);
  } else if (address.location && Array.isArray(address.location.coordinates) && address.location.coordinates.length === 2) {
    [lon1, lat1] = address.location.coordinates;
  } else if (b.latitude !== undefined && b.latitude !== null && b.longitude !== undefined && b.longitude !== null) {
    lat1 = Number(b.latitude);
    lon1 = Number(b.longitude);
  }

  let lat2 = null;
  let lon2 = null;
  if (
    vendorUserAccount.location &&
    Array.isArray(vendorUserAccount.location.coordinates) &&
    vendorUserAccount.location.coordinates.length === 2
  ) {
    [lon2, lat2] = vendorUserAccount.location.coordinates;
  } else if (
    vendorObj.location &&
    Array.isArray(vendorObj.location.coordinates) &&
    vendorObj.location.coordinates.length === 2
  ) {
    [lon2, lat2] = vendorObj.location.coordinates;
  } else if (
    vendorObj.latitude !== undefined &&
    vendorObj.latitude !== null &&
    vendorObj.longitude !== undefined &&
    vendorObj.longitude !== null
  ) {
    lat2 = Number(vendorObj.latitude);
    lon2 = Number(vendorObj.longitude);
  }

  let distanceInKm = null;
  if (
    lat1 !== null &&
    lon1 !== null &&
    lat2 !== null &&
    lon2 !== null &&
    !Number.isNaN(lat1) &&
    !Number.isNaN(lon1) &&
    !Number.isNaN(lat2) &&
    !Number.isNaN(lon2)
  ) {
    distanceInKm = calculateDistanceInKm(lat1, lon1, lat2, lon2);
  }

  // Address ID only from real populated database object (null if no DB address)
  const populatedAddress =
    typeof address === 'object' && address !== null && (address._id || address.id || address.address)
      ? address
      : b.addressId || null;

  let bookingDate = b.bookingDate || b.date || b.serviceDate || b.appointmentDate || b.createdAt;
  if (!bookingDate && b._id) {
    try {
      const idStr = b._id.toString();
      if (mongoose.Types.ObjectId.isValid(idStr)) {
        bookingDate = new mongoose.Types.ObjectId(idStr).getTimestamp();
      }
    } catch (e) {
      bookingDate = new Date();
    }
  }
  if (!bookingDate) {
    bookingDate = new Date();
  }
  const timeSlot = b.timeSlot || b.bookingTime || formatTime(bookingDate);

  // Extract MongoDB ID reliably even when toJSON transforms _id to id
  const mongoId =
    (b._id && b._id.toString()) ||
    (b.id && b.id.toString()) ||
    (booking && booking._id && booking._id.toString()) ||
    (booking && booking.id && booking.id.toString()) ||
    null;

  return {
    _id: mongoId,
    id: mongoId,
    bookingId: b.bookingId || '',
    customerName,
    vendorName,
    businessName,
    profilePic,
    mobileNumber,
    vendorMobileNumber: mobileNumber,
    vendor: vendorData,
    serviceName,
    totalAmount: b.totalAmount !== undefined && b.totalAmount !== null ? b.totalAmount : b.subtotal || 0,
    distanceInKm,
    addressId: populatedAddress,
    bookingDate,
    timeSlot,
    status: b.status,
    cancelReason: b.cancelReason || null,
  };
}

export async function populateVendorUsers(bookings) {
  if (!bookings || !Array.isArray(bookings) || bookings.length === 0) return bookings;

  try {
    const vendorUserIdsToFetch = [];
    const userIdsToFetch = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const b of bookings) {
      if (b && b.vendorId) {
        const v = b.vendorId;
        if (typeof v === 'object') {
          if (v.userId) {
            const uId = v.userId._id || v.userId;
            if (uId) {
              const uIdStr = uId.toString();
              if (mongoose.Types.ObjectId.isValid(uIdStr) && !userIdsToFetch.includes(uIdStr)) {
                userIdsToFetch.push(uIdStr);
              }
            }
          }
          if (v._id) {
            const vIdStr = v._id.toString();
            if (mongoose.Types.ObjectId.isValid(vIdStr)) {
              if (!vendorUserIdsToFetch.includes(vIdStr)) vendorUserIdsToFetch.push(vIdStr);
              if (!userIdsToFetch.includes(vIdStr)) userIdsToFetch.push(vIdStr);
            }
          }
        } else if (typeof v === 'string' || mongoose.Types.ObjectId.isValid(v)) {
          const vIdStr = v.toString();
          if (!vendorUserIdsToFetch.includes(vIdStr)) vendorUserIdsToFetch.push(vIdStr);
          if (!userIdsToFetch.includes(vIdStr)) userIdsToFetch.push(vIdStr);
        }
      }
    }

    const vendorUserMap = new Map();
    if (vendorUserIdsToFetch.length > 0) {
      const foundVendorUsers = await VendorUser.find({ _id: { $in: vendorUserIdsToFetch } }).lean();
      // eslint-disable-next-line no-restricted-syntax
      for (const vu of foundVendorUsers) {
        if (vu && vu._id) {
          vendorUserMap.set(vu._id.toString(), vu);
          if (vu.userId) {
            const uIdStr = (vu.userId._id || vu.userId).toString();
            if (mongoose.Types.ObjectId.isValid(uIdStr) && !userIdsToFetch.includes(uIdStr)) {
              userIdsToFetch.push(uIdStr);
            }
          }
        }
      }
    }

    const userMap = new Map();
    if (userIdsToFetch.length > 0) {
      const foundUsers = await User.find({ _id: { $in: userIdsToFetch } }).lean();
      // eslint-disable-next-line no-restricted-syntax
      for (const u of foundUsers) {
        if (u && u._id) {
          userMap.set(u._id.toString(), u);
        }
      }
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const b of bookings) {
      if (b && b.vendorId) {
        const vObj = b.vendorId;
        let vIdStr = null;
        if (vObj && vObj._id) {
          vIdStr = vObj._id.toString();
        } else if (vObj && vObj.toString) {
          vIdStr = vObj.toString();
        }

        let resolvedVendorUser = null;
        if (vObj && typeof vObj === 'object' && vObj.businessName !== undefined) {
          resolvedVendorUser = vObj;
        } else if (vIdStr && vendorUserMap.has(vIdStr)) {
          resolvedVendorUser = vendorUserMap.get(vIdStr);
        }

        let uIdStr = null;
        if (resolvedVendorUser && resolvedVendorUser.userId) {
          uIdStr = (resolvedVendorUser.userId._id || resolvedVendorUser.userId).toString();
        } else if (vIdStr && userMap.has(vIdStr)) {
          uIdStr = vIdStr;
        }

        let resolvedUser = null;
        if (uIdStr && userMap.has(uIdStr)) {
          resolvedUser = userMap.get(uIdStr);
        } else if (vObj && vObj.userId && typeof vObj.userId === 'object') {
          resolvedUser = vObj.userId;
        }

        b._resolvedVendorUser = resolvedVendorUser;
        b._resolvedUser = resolvedUser;
      }
    }
  } catch (err) {
    // Ignore vendor population errors and continue
  }

  return bookings;
}

export async function populateMissingAddresses(bookings) {
  if (!bookings || !Array.isArray(bookings) || bookings.length === 0) return bookings;

  try {
    const missingAddressIds = [];
    const missingCustomerIds = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const b of bookings) {
      if (b) {
        const addr = b.addressId;
        if (addr && (typeof addr === 'string' || mongoose.Types.ObjectId.isValid(addr)) && !addr.address) {
          missingAddressIds.push(addr._id || addr);
        } else if (!addr && b.customerId) {
          const cId = b.customerId._id || b.customerId;
          if (cId) missingCustomerIds.push(cId);
        }
      }
    }

    const addressMapById = new Map();
    const addressMapByCustomerId = new Map();

    if (missingAddressIds.length > 0) {
      const foundAddresses = await Address.find({ _id: { $in: missingAddressIds } });
      // eslint-disable-next-line no-restricted-syntax
      for (const a of foundAddresses) {
        addressMapById.set(a._id.toString(), a);
      }
    }

    if (missingCustomerIds.length > 0) {
      const foundCustomerAddresses = await Address.find({
        userId: { $in: missingCustomerIds },
        isDeleted: { $ne: true },
      }).sort({ isDefault: -1 });
      // eslint-disable-next-line no-restricted-syntax
      for (const a of foundCustomerAddresses) {
        if (a.userId && !addressMapByCustomerId.has(a.userId.toString())) {
          addressMapByCustomerId.set(a.userId.toString(), a);
        }
      }
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const b of bookings) {
      if (b) {
        const bAddr = b.addressId;
        // eslint-disable-next-line no-nested-ternary
        const addrKey = bAddr ? (bAddr._id ? bAddr._id.toString() : bAddr.toString()) : null;
        if (addrKey && addressMapById.has(addrKey)) {
          b.addressId = addressMapById.get(addrKey);
        } else if (!b.addressId && b.customerId) {
          const cIdStr = (b.customerId._id || b.customerId).toString();
          if (addressMapByCustomerId.has(cIdStr)) {
            b.addressId = addressMapByCustomerId.get(cIdStr);
          }
        }
      }
    }
  } catch (err) {
    // Ignore address population errors and continue
  }

  return bookings;
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
          select:
            'name fullName email mobileNumber profileImage profilePic userProfilePic location images countryCode businessName',
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

  // Ensure addressId is populated / fallback to customer default address
  let resolvedAddress = booking.addressId;
  if (!resolvedAddress && booking.customerId) {
    const cId = booking.customerId._id || booking.customerId;
    resolvedAddress =
      (await Address.findOne({ userId: cId, isDefault: true, isDeleted: { $ne: true } })) ||
      (await Address.findOne({ userId: cId, isDeleted: { $ne: true } }));
  } else if (resolvedAddress && typeof resolvedAddress === 'object' && !resolvedAddress.address) {
    const directAddr = await Address.findById(resolvedAddress._id || resolvedAddress);
    if (directAddr) {
      resolvedAddress = directAddr;
    }
  } else if (resolvedAddress && (typeof resolvedAddress === 'string' || mongoose.Types.ObjectId.isValid(resolvedAddress))) {
    const directAddr = await Address.findById(resolvedAddress);
    if (directAddr) {
      resolvedAddress = directAddr;
    }
  }
  booking.addressId = resolvedAddress;

  const populatedList = await populateVendorUsers([booking]);
  return enrichBookingWithDetails(populatedList[0]);
}

export async function getOne(query, options = {}) {
  let bookingQuery = Bookings.findOne(query, options.projection, options);
  if (!options.populate) {
    bookingQuery = bookingQuery.populate(defaultBookingPopulate);
  }
  const booking = await bookingQuery;
  if (!booking) {
    return booking;
  }
  const populatedList = await populateVendorUsers([booking]);
  return enrichBookingWithDetails(populatedList[0]);
}

export function buildBookingStatusFilter(status) {
  if (!status) return null;
  if (Array.isArray(status)) {
    const list = status.map((s) => (s.toLowerCase() === 'pending' ? 'panding' : s.toLowerCase()));
    return { $in: list };
  }
  if (typeof status === 'string') {
    if (status.includes(',')) {
      const list = status.split(',').map((s) => {
        const trimmed = s.trim().toLowerCase();
        return trimmed === 'pending' ? 'panding' : trimmed;
      });
      return { $in: list };
    }
    const normalized = status.trim().toLowerCase() === 'pending' ? 'panding' : status.trim().toLowerCase();
    return normalized;
  }
  return status;
}

export async function getBookingsList(filter, options = {}) {
  let sort = { createdAt: -1 };
  if (options.sortBy) {
    const sortOrder = options.sortOrder === 'asc' || options.sortOrder === 1 ? 1 : -1;
    sort = { [options.sortBy]: sortOrder };
  } else if (options.sort) {
    sort = options.sort;
  }

  let query = Bookings.find(filter, options.projection, options);
  if (options.populate) {
    query = query.populate(options.populate);
  } else {
    query = query.populate(defaultBookingPopulate);
  }
  query = query.sort(sort);

  if (options.page && options.limit) {
    const page = parseInt(options.page, 10);
    const limit = parseInt(options.limit, 10);
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);
  }

  let bookings = await query;
  bookings = await populateMissingAddresses(bookings);
  bookings = await populateVendorUsers(bookings);
  return bookings.map((b) => enrichBookingWithDetails(b));
}

export async function getBookingsListWithPagination(filter, options = {}) {
  const page = options.page ? parseInt(options.page, 10) : 1;
  const limit = options.limit ? parseInt(options.limit, 10) : 10;
  const skip = (page - 1) * limit;

  let sort = { createdAt: -1 };
  if (options.sortBy) {
    const sortOrder = options.sortOrder === 'asc' || options.sortOrder === 1 ? 1 : -1;
    sort = { [options.sortBy]: sortOrder };
  } else if (options.sort) {
    sort = options.sort;
  }

  const [totalResults, rawDocs] = await Promise.all([
    Bookings.countDocuments(filter),
    Bookings.find(filter).populate(defaultBookingPopulate).sort(sort).skip(skip).limit(limit),
  ]);

  const totalPages = Math.ceil(totalResults / limit) || 1;
  let populatedDocs = await populateMissingAddresses(rawDocs);
  populatedDocs = await populateVendorUsers(populatedDocs);
  const enrichedResults = populatedDocs.map((b) => enrichBookingWithDetails(b));

  return {
    results: enrichedResults,
    page,
    limit,
    totalPages,
    totalResults,
  };
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
  const realTime = formatTime(now);

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

  // Synchronize timeSlot & bookingTime reliably
  const resolvedTime = body.timeSlot || body.bookingTime || realTime;
  // eslint-disable-next-line no-param-reassign
  body.timeSlot = resolvedTime;
  // eslint-disable-next-line no-param-reassign
  body.bookingTime = resolvedTime;

  if (body.bookingType === 'schedule' || (body.timeSlot && body.timeSlot !== realTime)) {
    // eslint-disable-next-line no-param-reassign
    body.bookingType = 'schedule';
  } else {
    // eslint-disable-next-line no-param-reassign
    body.bookingType = (vendorAvailability && vendorAvailability.bookingOption) || 'instant';
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
    // Auto-attach default customer address if addressId was not provided in request
    if (!body.addressId) {
      const defaultAddress =
        // eslint-disable-next-line no-await-in-loop
        (await Address.findOne({ userId: body.customerId, isDefault: true, isDeleted: { $ne: true } })) ||
        // eslint-disable-next-line no-await-in-loop
        (await Address.findOne({ userId: body.customerId, isDeleted: { $ne: true } }));
      if (defaultAddress) {
        // eslint-disable-next-line no-param-reassign
        body.addressId = defaultAddress._id;
      }
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
