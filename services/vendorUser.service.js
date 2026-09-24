import ApiError from 'utils/ApiError';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { VendorUser, User, Bank, Categories, VendorService, BusinessAddress, VendorAvailability, Reviews } from 'models';
import { generateOtp } from 'utils/common';
import { countryCodeService, emailService } from 'services';
import { EnumCodeTypeOfCode } from 'models/enum.model';
import { sendOtpToMobile } from './mobileotp.service';

export async function getVendorUserById(id, options = {}) {
  const vendorUser = await VendorUser.findById(id, options.projection, options).populate('categoryId');
  return vendorUser;
}

export async function getOne(query, options = {}) {
  const vendorUser = await VendorUser.findOne(query, options.projection, options).populate('categoryId');
  return vendorUser;
}

export async function getVendorUserList(filter, options = {}) {
  const vendorUser = await VendorUser.find(filter, options.projection, options).populate('categoryId');
  return vendorUser;
}

export async function getVendorUserListWithPagination(filter, options = {}) {
  const paginateOptions = {
    ...options,
    populate: options.populate ? [].concat(options.populate, 'categoryId') : 'categoryId',
  };
  const vendorUser = await VendorUser.paginate(filter, paginateOptions);
  return vendorUser;
}

export function calculateVisitCharges(serviceRadius) {
  if (!serviceRadius || serviceRadius <= 0) return [];
  const charges = [];

  const tiers = [
    { min: 0, max: 5, charge: 100 },
    { min: 5, max: 10, charge: 150 },
    { min: 10, max: 15, charge: 200 },
    { min: 15, max: 20, charge: 500 },
    { min: 20, max: 25, charge: 700 },
    { min: 25, max: Infinity, charge: 1000 },
  ];

  // eslint-disable-next-line no-restricted-syntax
  for (const tier of tiers) {
    if (serviceRadius > tier.min) {
      const maxDistance = Math.min(serviceRadius, tier.max);
      charges.push({
        minDistance: tier.min,
        maxDistance: maxDistance === Infinity ? serviceRadius : maxDistance,
        charge: tier.charge,
      });
    }
    if (serviceRadius <= tier.max) {
      break;
    }
  }
  return charges;
}

export async function createVendorUser(body = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  if (body.bankDetailsId) {
    const bankDetailsId = await Bank.findOne({ _id: body.bankDetailsId });
    if (!bankDetailsId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field bankDetailsId is not valid');
    }
  }
  if (body.categoryId) {
    const categoryId = await Categories.findOne({ _id: body.categoryId });
    if (!categoryId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field categoryId is not valid');
    }
  }
  if (body.serviceRadius !== undefined) {
    // eslint-disable-next-line no-param-reassign
    body.visitCharges = calculateVisitCharges(body.serviceRadius);
  }
  const vendorUser = await VendorUser.create(body);
  return vendorUser;
}

export async function updateVendorUser(filter, body, options = {}) {
  if (body.userId) {
    const userId = await User.findOne({ _id: body.userId });
    if (!userId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field userId is not valid');
    }
  }
  if (body.bankDetailsId) {
    const bankDetailsId = await Bank.findOne({ _id: body.bankDetailsId });
    if (!bankDetailsId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field bankDetailsId is not valid');
    }
  }
  if (body.categoryId) {
    const categoryId = await Categories.findOne({ _id: body.categoryId });
    if (!categoryId) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'field categoryId is not valid');
    }
  }
  if (body.serviceRadius !== undefined) {
    // eslint-disable-next-line no-param-reassign
    body.visitCharges = calculateVisitCharges(body.serviceRadius);
  }
  const vendorUser = await VendorUser.findOneAndUpdate(filter, body, options);
  return vendorUser;
}

export async function updateManyVendorUser(filter, body, options = {}) {
  const vendorUser = await VendorUser.updateMany(filter, body, options);
  return vendorUser;
}

export async function removeVendorUser(filter) {
  const vendorUser = await VendorUser.findOneAndRemove(filter);
  return vendorUser;
}

export async function removeManyVendorUser(filter) {
  const vendorUser = await VendorUser.deleteMany(filter);
  return vendorUser;
}

export async function aggregateVendorUser(query) {
  const vendorUser = await VendorUser.aggregate(query);
  return vendorUser;
}

// export async function aggregateVendorUserWithPagination(query, options = {}) {
//   const aggregate = VendorUser.aggregate();
//   query.map((obj) => {
//     aggregate._pipeline.push(obj);
//   });
//   const vendorUser = await VendorUser.aggregatePaginate(aggregate, options);
//   return vendorUser;
// }

export async function updateVendorProfile(user, body) {
  const { name, email, mobileNumber, countryCodeId, profileImage, businessName, gstNumber, categoryId, serviceRadius } =
    body;

  // 1. Update VendorUser details
  const vendorUserUpdate = {};
  if (businessName !== undefined) vendorUserUpdate.businessName = businessName;
  if (gstNumber !== undefined) vendorUserUpdate.gstNumber = gstNumber;
  if (serviceRadius !== undefined) {
    vendorUserUpdate.serviceRadius = serviceRadius;
    vendorUserUpdate.visitCharges = calculateVisitCharges(serviceRadius);
  }
  if (categoryId !== undefined) {
    if (categoryId) {
      const categoryExists = await Categories.findOne({ _id: categoryId });
      if (!categoryExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'field categoryId is not valid');
      }
    }
    vendorUserUpdate.categoryId = categoryId || null;
  }

  const updatedVendorUser = await VendorUser.findOneAndUpdate(
    { userId: user._id },
    { $set: vendorUserUpdate, userId: user._id },
    { new: true, upsert: true }
  );

  // 2. Update normal User fields
  const userUpdate = {};
  if (name !== undefined) {
    userUpdate.name = name;
    userUpdate.fullName = name;
  }
  if (profileImage !== undefined) userUpdate.profileImage = profileImage;
  if (businessName !== undefined) userUpdate.businessName = businessName;

  if (Object.keys(userUpdate).length) {
    Object.assign(user, userUpdate);
    await user.save();
  }

  // 3. Handle Email Update Verification
  if (email && email !== user.email) {
    const exists = await User.findOne({
      email,
      _id: { $ne: user._id },
    });

    if (exists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
    }

    const otp = generateOtp();
    user.codes.push({
      code: String(otp),
      codeType: EnumCodeTypeOfCode.EMAIL,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
    });
    // eslint-disable-next-line no-param-reassign
    user.pendingEmail = email;
    await user.save();

    await emailService.sendOtpVerificationEmail({ email }, otp);

    return {
      user,
      vendorUser: updatedVendorUser,
      verifyRequired: true,
      verifyType: 'email',
      message: 'OTP sent to email. Please verify.',
    };
  }

  // 4. Handle Mobile Update Verification
  if (mobileNumber && mobileNumber !== user.mobileNumber) {
    const country = await countryCodeService.getCountryCodeById(countryCodeId);
    if (!country) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Valid countryCodeId required');
    }

    const exists = await User.findOne({
      mobileNumber,
      _id: { $ne: user._id },
    });
    if (exists) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Mobile number already taken');
    }

    const otp = generateOtp();
    user.codes.push({
      code: String(otp),
      codeType: EnumCodeTypeOfCode.MOBILE,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
    });
    // eslint-disable-next-line no-param-reassign
    user.pendingMobileNumber = mobileNumber;
    // eslint-disable-next-line no-param-reassign
    user.pendingCountryCode = country.code;
    await user.save();

    await sendOtpToMobile(`${country.code}${mobileNumber}`, otp);

    return {
      user,
      vendorUser: updatedVendorUser,
      verifyRequired: true,
      verifyType: 'mobile',
      message: 'OTP sent to mobile. Please verify.',
    };
  }

  return {
    user,
    vendorUser: updatedVendorUser,
    verifyRequired: false,
    message: 'Profile updated successfully',
  };
}

export async function getNearVendorUsersByCategory(longitude, latitude, categoryId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const skip = (page - 1) * limit;

  const matchStage = {
    role: 'vendor',
    isDeleted: { $ne: true },
  };

  const pipeline = [
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)],
        },
        distanceField: 'distance',
        maxDistance: 15000, // 15km limit
        spherical: true,
        query: matchStage,
      },
    },
    {
      $lookup: {
        from: 'VendorUser',
        localField: '_id',
        foreignField: 'userId',
        as: 'vendorUser',
      },
    },
    { $unwind: '$vendorUser' },
    {
      $match: {
        'vendorUser.categoryId': new mongoose.Types.ObjectId(categoryId),
        'vendorUser.isDeleted': { $ne: true },
      },
    },
    {
      $lookup: {
        from: 'Categories',
        localField: 'vendorUser.categoryId',
        foreignField: '_id',
        as: 'categoryDetails',
      },
    },
    { $unwind: { path: '$categoryDetails', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'VendorAvailability',
        localField: 'vendorUser._id',
        foreignField: 'vendorId',
        as: 'vendorAvailability',
      },
    },
    { $unwind: { path: '$vendorAvailability', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: '$vendorUser._id',
        userId: {
          _id: '$_id',
          name: '$name',
          email: '$email',
          mobileNumber: '$mobileNumber',
          countryCode: '$countryCode',
          fullName: '$fullName',
          profileImage: '$profileImage',
          profilePic: '$profilePic',
          location: '$location',
        },
        businessName: { $ifNull: ['$vendorUser.businessName', '$businessName'] },
        gstNumber: '$vendorUser.gstNumber',
        description: '$vendorUser.description',
        experience: '$vendorUser.experience',
        rating: { $ifNull: ['$vendorUser.rating', 0] },
        totalReviews: { $ifNull: ['$vendorUser.totalReviews', 0] },
        serviceRadius: '$vendorUser.serviceRadius',
        visitCharges: '$vendorUser.visitCharges',
        isKycVerified: '$vendorUser.isKycVerified',
        kycStatus: '$vendorUser.kycStatus',
        profileCompleted: '$vendorUser.profileCompleted',
        avgResponseTime: '$vendorUser.avgResponseTime',
        completedBookings: '$vendorUser.completedBookings',
        categoryId: '$vendorUser.categoryId',
        categoryDetails: {
          _id: '$categoryDetails._id',
          title: '$categoryDetails.title',
          icon: '$categoryDetails.icon',
          image: '$categoryDetails.image',
        },
        vendorAvailability: '$vendorAvailability',
        distance: '$distance',
      },
    },
    {
      $sort: {
        distance: 1,
      },
    },
    {
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];

  const results = await User.aggregate(pipeline);
  const total = (results[0] && results[0].metadata && results[0].metadata[0] && results[0].metadata[0].total) || 0;
  const data = (results[0] && results[0].data) || [];

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[new Date().getDay()];

  const docsWithCharge = data.map((doc) => {
    let charge = null;
    if (doc.distance !== undefined && doc.distance !== null && doc.visitCharges && Array.isArray(doc.visitCharges)) {
      const distanceKm = doc.distance / 1000;
      const matchedCharge = doc.visitCharges.find((vc) => distanceKm >= vc.minDistance && distanceKm <= vc.maxDistance);
      if (matchedCharge) {
        charge = matchedCharge.charge;
      }
    }

    const va = doc.vendorAvailability;
    const isOnline = va && va.isOnline !== undefined ? Boolean(va.isOnline) : true;
    const storeStatus = (va && va.storeStatus) || (isOnline ? 'online' : 'offline');
    const bookingOption = (va && va.bookingOption) || 'instant';
    const instantArrivalEstimate = (va && va.instantArrivalEstimate) || '30-40 mins';

    // Check if open today in weekly schedule
    let isOpenToday = true;
    if (va && va.weeklySchedule && Array.isArray(va.weeklySchedule)) {
      const todaySchedule = va.weeklySchedule.find((s) => s.day && s.day.toLowerCase() === todayDayName);
      if (todaySchedule) {
        isOpenToday = Boolean(todaySchedule.isOpen);
      }
    }

    const isAvailable = isOnline && isOpenToday;

    let statusText = 'Available';
    let statusBadge = 'available';

    if (!isOnline) {
      statusText = 'Currently Unavailable';
      statusBadge = 'offline';
    } else if (!isOpenToday) {
      statusText = 'Closed Today';
      statusBadge = 'closed';
    } else if (bookingOption === 'instant') {
      statusText = `Arriving in ${instantArrivalEstimate}`;
      statusBadge = 'instant';
    } else {
      statusText = 'Open for Schedule';
      statusBadge = 'schedule';
    }

    const userIdVal = (doc.userId && doc.userId._id) || doc.userId;
    const profilePicVal = (doc.userId && (doc.userId.profilePic || doc.userId.profileImage)) || null;
    const categoryTitleVal = (doc.categoryDetails && doc.categoryDetails.title) || null;
    const rating = doc.rating !== undefined && doc.rating !== null ? Number(doc.rating) : 0;
    const totalReviews = doc.totalReviews !== undefined && doc.totalReviews !== null ? Number(doc.totalReviews) : 0;

    return {
      _id: doc._id,
      userId: userIdVal,
      categoryId: doc.categoryId,
      businessName: doc.businessName,
      categoryTitle: categoryTitleVal,
      profilePic: profilePicVal,
      charge,
      distance: doc.distance !== undefined && doc.distance !== null ? Math.round((doc.distance / 1000) * 100) / 100 : null,
      rating,
      averageRating: rating,
      totalReviews,
      vendorAvailability: {
        isOnline,
        storeStatus,
        isOpenToday,
        isAvailable,
        statusText,
        statusBadge,
        bookingOption,
        instantArrivalEstimate,
      },
    };
  });

  return {
    docs: docsWithCharge,
    totalDocs: total,
    limit,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getVendorUserDetailsWithServices(vendorUserId) {
  const vendorUser = await VendorUser.findById(vendorUserId).populate('userId').populate('categoryId');

  if (!vendorUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Vendor user not found');
  }

  const vObjectId = mongoose.Types.ObjectId.isValid(vendorUserId) ? new mongoose.Types.ObjectId(vendorUserId) : vendorUserId;
  const vendorUserUserId = (vendorUser.userId && vendorUser.userId._id) || vendorUser.userId;
  const vUserObjectId =
    vendorUserUserId && mongoose.Types.ObjectId.isValid(vendorUserUserId)
      ? new mongoose.Types.ObjectId(vendorUserUserId)
      : vendorUserUserId;

  const targetVendorIds = [vObjectId];
  if (vUserObjectId && vUserObjectId.toString() !== vObjectId.toString()) {
    targetVendorIds.push(vUserObjectId);
  }

  const matchFilter = {
    vendorId: { $in: targetVendorIds },
    isDeleted: { $ne: true },
  };

  // Run all independent queries concurrently in a single round-trip with .lean() for zero-overhead performance
  const [services, businessAddress, va, reviewsList, statsFacet] = await Promise.all([
    VendorService.find({ vendorId: vendorUserId, isDeleted: { $ne: true } })
      .populate('serviceId')
      .populate('categoryId')
      .lean(),
    BusinessAddress.findOne({
      userId: vendorUserUserId,
      isDeleted: { $ne: true },
    }).lean(),
    VendorAvailability.findOne({ vendorId: vendorUserId, isDeleted: { $ne: true } }).lean(),
    // Strictly load only the latest 5 reviews for high speed and minimal payload
    Reviews.find(matchFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'customerId',
        select: 'name fullName email mobileNumber countryCode profileImage profilePic userProfilePic',
      })
      .lean(),
    // Fast database-level aggregation for total count, average, and star breakdown
    Reviews.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 },
              },
            },
          ],
          breakdown: [
            {
              $group: {
                _id: '$rating',
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]),
  ]);

  // Process rating & review statistics natively calculated by MongoDB
  const summary = (statsFacet[0] && statsFacet[0].summary && statsFacet[0].summary[0]) || null;
  const rawBreakdown = (statsFacet[0] && statsFacet[0].breakdown) || [];

  const totalReviews = summary ? summary.totalReviews : Number(vendorUser.totalReviews) || 0;
  const averageRating = summary ? Math.round(summary.avgRating * 10) / 10 : Number(vendorUser.rating) || 0;

  const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  rawBreakdown.forEach((rc) => {
    const rounded = Math.round(Number(rc._id) || 0);
    if (breakdown[rounded] !== undefined) {
      breakdown[rounded] += rc.count;
    }
  });

  const breakdownWithPercentage = {};
  Object.keys(breakdown).forEach((star) => {
    const count = breakdown[star];
    const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
    breakdownWithPercentage[star] = {
      count,
      percentage,
    };
  });

  function extractCustomerProfilePic(user) {
    if (!user || typeof user !== 'object') return '';
    if (typeof user.profilePic === 'string' && user.profilePic.trim().length > 0) {
      return user.profilePic.trim();
    }
    if (typeof user.profileImage === 'string' && user.profileImage.trim().length > 0) {
      return user.profileImage.trim();
    }
    if (Array.isArray(user.userProfilePic) && user.userProfilePic.length > 0) {
      for (let i = user.userProfilePic.length - 1; i >= 0; i -= 1) {
        const p = user.userProfilePic[i];
        if (p) {
          if (typeof p === 'string' && p.trim().length > 0) return p.trim();
          if (typeof p === 'object' && p.url && typeof p.url === 'string' && p.url.trim().length > 0) return p.url.trim();
        }
      }
    }
    if (Array.isArray(user.images) && user.images.length > 0) {
      for (let i = user.images.length - 1; i >= 0; i -= 1) {
        const img = user.images[i];
        if (img) {
          if (typeof img === 'string' && img.trim().length > 0) return img.trim();
          if (typeof img === 'object' && img.url && typeof img.url === 'string' && img.url.trim().length > 0)
            return img.url.trim();
        }
      }
    }
    return '';
  }

  // Format only the latest 5 reviews
  const formattedReviews = reviewsList.map((rev) => {
    const cust = rev.customerId && typeof rev.customerId === 'object' ? rev.customerId : {};
    const customerName = cust.fullName || cust.name || 'Customer';
    const customerImage = extractCustomerProfilePic(cust);
    const ratingValue = rev.rating !== undefined && rev.rating !== null ? Number(rev.rating) : 0;

    return {
      ...rev,
      _id: rev._id,
      id: rev._id ? rev._id.toString() : rev.id,
      rating: ratingValue,
      stars: ratingValue,
      review: rev.review || '',
      reviewMessage: rev.review || '',
      message: rev.review || '',
      customerName,
      customerImage,
      customer: {
        id: cust._id ? cust._id.toString() : cust.id,
        _id: cust._id,
        name: customerName,
        fullName: cust.fullName || cust.name || 'Customer',
        email: cust.email || '',
        mobileNumber: cust.mobileNumber || null,
        profileImage: customerImage,
        profilePic: customerImage,
        image: customerImage,
      },
    };
  });

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDayName = dayNames[new Date().getDay()];

  const isOnline = va && va.isOnline !== undefined ? Boolean(va.isOnline) : true;
  const storeStatus = (va && va.storeStatus) || (isOnline ? 'online' : 'offline');
  const bookingOption = (va && va.bookingOption) || 'instant';
  const instantArrivalEstimate = (va && va.instantArrivalEstimate) || '30-40 mins';

  let isOpenToday = true;
  if (va && va.weeklySchedule && Array.isArray(va.weeklySchedule)) {
    const todaySchedule = va.weeklySchedule.find((s) => s.day && s.day.toLowerCase() === todayDayName);
    if (todaySchedule) {
      isOpenToday = Boolean(todaySchedule.isOpen);
    }
  }

  const isAvailable = isOnline && isOpenToday;

  let statusText = 'Available';
  let statusBadge = 'available';

  if (!isOnline) {
    statusText = 'Currently Unavailable';
    statusBadge = 'offline';
  } else if (!isOpenToday) {
    statusText = 'Closed Today';
    statusBadge = 'closed';
  } else if (bookingOption === 'instant') {
    statusText = `Arriving in ${instantArrivalEstimate}`;
    statusBadge = 'instant';
  } else {
    statusText = 'Open for Schedule';
    statusBadge = 'schedule';
  }

  const availabilityInfo = {
    isOnline,
    storeStatus,
    isOpenToday,
    isAvailable,
    statusText,
    statusBadge,
    bookingOption,
    instantArrivalEstimate,
    weeklySchedule: (va && va.weeklySchedule) || [],
  };

  const vendorUserObj = typeof vendorUser.toJSON === 'function' ? vendorUser.toJSON() : vendorUser.toObject();
  vendorUserObj._id = vendorUser._id;
  vendorUserObj.id = vendorUser._id ? vendorUser._id.toString() : vendorUser.id;
  vendorUserObj.rating = averageRating;
  vendorUserObj.averageRating = averageRating;
  vendorUserObj.averageReview = averageRating;
  vendorUserObj.totalReviews = totalReviews;
  vendorUserObj.reviews = formattedReviews;

  // Sync back to db asynchronously in background without blocking response
  if (vendorUser.rating !== averageRating || vendorUser.totalReviews !== totalReviews) {
    VendorUser.findByIdAndUpdate(vObjectId, {
      rating: averageRating,
      totalReviews,
    }).catch((err) => console.error('[VendorUser] Error syncing rating/totalReviews:', err.message));
  }

  return {
    vendorUser: vendorUserObj,
    businessAddress,
    services,
    vendorAvailability: availabilityInfo,
    rating: averageRating,
    averageRating,
    averageReview: averageRating,
    totalReviews,
    reviewStats: {
      averageRating,
      totalReviews,
      breakdown: breakdownWithPercentage,
    },
    reviews: formattedReviews,
  };
}
