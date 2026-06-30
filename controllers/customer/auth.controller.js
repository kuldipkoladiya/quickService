import httpStatus from 'http-status';
import { generateOtp } from 'utils/common';
import ApiError from 'utils/ApiError';
import { catchAsync } from 'utils/catchAsync';
import { authService, tokenService, userService, emailService, countryCodeService } from 'services';

import { EnumTypeOfToken, EnumCodeTypeOfCode, EnumRoleOfUser } from 'models/enum.model';
import { sendOtpToMobile } from '../../services/mobileotp.service';

export const registerCustomer = catchAsync(async (req, res) => {
  const { body } = req;
  const { email, mobileNumber, countryCodeId } = body;

  let user;

  // 🔍 Find user by email or mobile
  if (email) {
    user = await userService.getOne({ email, role: EnumRoleOfUser.CUSTOMER });
  } else if (mobileNumber) {
    user = await userService.getOne({ mobileNumber, role: EnumRoleOfUser.CUSTOMER });
  }

  // 🌍 Handle country code (only for mobile)
  let countryCode = null;
  if (mobileNumber) {
    const country = await countryCodeService.getCountryCodeById(countryCodeId);
    if (!country) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Valid countryCodeId is required for mobile registration');
    }
    countryCode = country.code;
  }

  // 🆕 Create user if not exists
  if (!user) {
    user = await userService.createUser({
      ...body,
      role: EnumRoleOfUser.CUSTOMER,
      ...(countryCode && { countryCode }),
    });
  }

  // 🔐 Generate OTP
  const otp = generateOtp();

  user.codes.push({
    code: String(otp),
    expirationDate: Date.now() + 10 * 60 * 1000,
    used: false,
    codeType: EnumCodeTypeOfCode.LOGIN,
  });

  await user.save();

  // 📩 Send OTP
  if (mobileNumber) {
    await sendOtpToMobile(`${countryCode}${mobileNumber}`, otp);
  } else if (email) {
    await emailService.sendOtpVerificationEmail(user, otp);
  }

  return res.status(httpStatus.OK).send({
    results: {
      success: true,
      message: 'OTP sent successfully. Please verify to continue.',
    },
  });
});

export const register = catchAsync(async (req, res) => {
  const { body } = req;

  let userCountryCode = null;

  // Check for mobile number and fetch country code only if mobile number is present
  if (body.mobileNumber) {
    userCountryCode = await countryCodeService.getCountryCodeById(body.countryCodeId);
    if (!userCountryCode) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        'Please provide a valid countryCode while using registration with a mobile number.'
      );
    }
  }

  const { email, mobileNumber, businessName } = body;

  if (email && (await userService.getOne({ email, role: EnumRoleOfUser.VENDOR }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  if (mobileNumber && (await userService.getOne({ mobileNumber, role: EnumRoleOfUser.VENDOR }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Mobile number already taken');
  }

  if (businessName && (await userService.getOne({ businessName, role: EnumRoleOfUser.VENDOR }))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Business name already taken');
  }

  // Create the user object, only add countryCode if the user registered with a mobile number
  const user = await userService.createUser({
    ...body,
    role: EnumRoleOfUser.VENDOR,
    ...(userCountryCode && { countryCode: userCountryCode.code }), // Only include countryCode if it's present
  });

  const otp = generateOtp();
  user.codes.push({
    code: otp,
    expirationDate: Date.now() + 10 * 60 * 1000, // OTP valid for 10 minutes
    used: false,
    codeType: EnumCodeTypeOfCode.LOGIN,
  });
  await user.save();

  // Send OTP based on mobile or email
  if (user.mobileNumber) {
    // Send OTP to mobile via MSG91 API
    try {
      await sendOtpToMobile(`${user.countryCode}${user.mobileNumber}`, otp); // Call your function to send OTP via MSG91
      console.log('OTP sent to mobile via MSG91');
    } catch (error) {
      console.error('Error sending OTP to mobile:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error sending OTP to mobile',
      });
    }
  } else if (user.email) {
    // Send OTP to email
    try {
      await emailService.sendOtpVerificationEmail(user, otp);
      console.log('OTP sent to email');
    } catch (error) {
      console.error('Error sending OTP to email:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
        message: 'Error sending OTP to email',
      });
    }
  }

  // Create notification for OTP
  // const createNotificationForOtp = await Notification.create({
  //   userId: user._id,
  //   body: EnumOfNotification.OTP_SEND,
  // });
  //
  // // console.log('Notification created for OTP:', createNotificationForOtp);
  //
  // // Send notification if device tokens are present
  // if (user && user.deviceTokens && user.deviceTokens.length) {
  //   const deviceToken = user.deviceTokens.map((fcmToken) => fcmToken.deviceToken);
  //   await sendNotification(
  //       deviceToken,
  //       {
  //         data: {
  //           _id: createNotificationForOtp._id.toString(),
  //           userId: createNotificationForOtp.userId.toString(),
  //           body: EnumOfNotification.OTP_SEND,
  //           createdAt: createNotificationForOtp.createdAt.toString(),
  //           updatedAt: createNotificationForOtp.updatedAt.toString(),
  //         },
  //       },
  //       {}
  //   );
  // }

  res.status(httpStatus.OK).send({
    results: {
      success: true,
      message: 'OTP has been sent to your registered mobile or email. Please verify.',
    },
  });
});
export const login = catchAsync(async (req, res) => {
  const { email, password, mobileNumber, countryCodeId, deviceToken, role } = req.body;

  // First, authenticate the user with email/password or mobile/password
  const user = await authService.loginUserWithEmailOrMobileAndPassword(email, mobileNumber, countryCodeId, password, role);

  // const checkUserActivePlan = await checkUserPremiumStatus(user._id);
  // // console.log('=====xx====>', checkUserActivePlan);
  //
  // // Check if 2FA is enabled for this user
  // if (user.twoFactorAuth && user.twoFactorAuth.isEnabled) {
  //   // If 2FA is enabled but no code provided, return a response indicating 2FA is required
  //   if (!twoFactorCode) {
  //     if (user.twoFactorAuth.method === EnumOf2faMethod.OTP) {
  //       await generateAndSendOtp(user);
  //       return res.status(httpStatus.BAD_REQUEST).send({
  //         requireTwoFactor: true,
  //         method: user.twoFactorAuth.method,
  //         message: 'Two-factor authentication code required',
  //         userId: user.id,
  //         email: maskEmail(user.email),
  //         mobileNumber: maskMobileNumber(user.mobileNumber),
  //         otpType: user.twoFactorAuth.otpType,
  //       });
  //     }
  //     return res.status(httpStatus.BAD_REQUEST).send({
  //       requireTwoFactor: true,
  //       method: user.twoFactorAuth.method,
  //       message: 'Two-factor authentication code required',
  //       userId: user.id,
  //     });
  //   }
  //
  //   // Verify the 2FA code based on method
  //   const isValid = await twoFactorAuthService.verifyToken(user, twoFactorCode);
  //   if (!isValid) {
  //     return res.status(httpStatus.UNAUTHORIZED).send({
  //       requireTwoFactor: true,
  //       method: user.twoFactorAuth.method,
  //       message: 'Invalid two-factor authentication code',
  //     });
  //   }
  // }

  // If 2FA is not enabled or code is valid, proceed with login
  const tokens = await tokenService.generateAuthTokens(user);
  if (deviceToken) {
    const updatedUser = await userService.addDeviceToken(user, req.body);
    res.status(httpStatus.OK).send({ results: { user: updatedUser, tokens } });
  } else {
    res.status(httpStatus.OK).send({ results: { user, tokens } });
  }
});

// if user's email is not verified then we call this function for reverification
export const sendVerifyEmail = catchAsync(async (req, res) => {
  const { email, role = EnumRoleOfUser.CUSTOMER } = req.body;
  const emailVerifyToken = await tokenService.generateVerifyEmailToken(email, role);
  const user = await userService.getOne({ email, role });
  emailService.sendEmailVerificationEmail(user, emailVerifyToken, role).then().catch();
  res.status(httpStatus.OK).send({
    success: true,
    message: 'Email has been sent to your registered email. Please check your email and verify it',
  });
});

/**
 * Token-based forgotPassword Verify Controller
 * @type {(request.query: token)}
 * @return (successMessage)
 */
export const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query);
  res.status(httpStatus.OK).send({ message: 'Your Email is Verified Successfully' });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email, role } = req.body;
  await authService.forgotPassword(email, role);
  res.status(httpStatus.OK).send({ results: { success: true, message: 'Code has been sent' } });
});

/**
 * Token-based forgotPassword Controller
 * @type {(function(*, *, *): void)|*}
 */
export const forgotPasswordToken = catchAsync(async (req, res) => {
  const { email, role } = req.body;
  const resetPasswordToken = await tokenService.generateResetPasswordToken(email, role);
  await emailService.sendResetPasswordEmail(email, resetPasswordToken);
  res.status(httpStatus.OK).send({ success: true, message: 'Reset password link is sent to your email successfully' });
});

/**
 * Token-based forgotPassword Verify Controller
 * @type {(function(*, *, *): void)|*}
 */
export const verifyResetCode = catchAsync(async (req, res) => {
  req.body.type = EnumTypeOfToken.RESET_PASSWORD;
  await tokenService.verifyCode(req.body);
  res.status(httpStatus.OK).send({ success: true });
});

export const verifyOtpCustomer = catchAsync(async (req, res) => {
  const { otp, email, mobileNumber, deviceToken } = req.body;

  const user = await tokenService.verifyOtpCustomer({ email, mobileNumber, otp });

  const tokens = await tokenService.generateAuthTokens(user);

  let updatedUser = user;

  if (deviceToken) {
    updatedUser = await userService.addDeviceToken(user, req.body);
  }

  return res.status(httpStatus.OK).send({
    results: {
      success: true,
      message: 'Login successful',
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        mobileNumber: updatedUser.mobileNumber,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
      },
      tokens,
    },
  });
});
export const verifyOtpVendor = catchAsync(async (req, res) => {
  const { otp, email, mobileNumber, deviceToken } = req.body;

  // Pass both to allow fallback
  await tokenService.verifyOtp({ email, mobileNumber, otp });

  const user = await userService.getOne(
    email ? { email, role: EnumRoleOfUser.VENDOR } : { mobileNumber, role: EnumRoleOfUser.VENDOR }
  );

  const tokens = await tokenService.generateAuthTokens(user);

  let updatedUser = user;

  if (deviceToken) {
    updatedUser = await userService.addDeviceToken(user, req.body);
  }

  // // Send congratulation email
  // await emailService.sendCongratulationEmail(user);
  //
  // // Create notification in DB
  // const createNotificationForCongratulation = await Notification.create({
  //   userId: updatedUser._id,
  //   body: EnumOfNotification.CONGRATULATION,
  // });
  //
  // // Send push notification if user has device tokens
  // if (updatedUser.deviceTokens && updatedUser.deviceTokens.length) {
  //   const deviceTokens = updatedUser.deviceTokens.map((fcmToken) => fcmToken.deviceToken);
  //
  //   await sendNotification(
  //       deviceTokens,
  //       {
  //         data: {
  //           _id: createNotificationForCongratulation._id.toString(),
  //           userId: createNotificationForCongratulation.userId.toString(),
  //           body: EnumOfNotification.CONGRATULATION,
  //           createdAt: createNotificationForCongratulation.createdAt.toString(),
  //           updatedAt: createNotificationForCongratulation.updatedAt.toString(),
  //         },
  //       },
  //       {}
  //   );
  // }

  return res.status(httpStatus.OK).send({ results: { user: updatedUser, tokens } });
});
export const verifyOtp = catchAsync(async (req, res) => {
  const { body } = req;
  const { otp, email } = body;
  await tokenService.verifyOtp(email, otp);
  res.status(httpStatus.OK).send({ results: { success: true } });
});

export const resetPasswordOtp = catchAsync(async (req, res) => {
  await authService.resetPasswordOtp(req.body);
  res.status(httpStatus.OK).send({ results: { success: true, message: 'Password has been reset successfully' } });
});

export const resetPasswordOtpVerify = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const user = await tokenService.verifyResetOtpVerify(email, otp);
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'something is went wrong!');
  }
  res.status(httpStatus.OK).send({ results: { success: true } });
});

/**
 * Token-based resetPassword Controller
 * @type {(function(*, *, *): void)|*}
 */
export const resetPasswordToken = catchAsync(async (req, res) => {
  await authService.resetPasswordToken(req.body);
  res.status(httpStatus.OK).send({ success: true, message: 'Password has been reset successfully' });
});

export const userInfo = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user._id);
  res.status(httpStatus.OK).send({ results: { user } });
});

/**
 * Update the userInfo when he is LoggedIn
 * @type {(function(*, *, *): void)|*}
 */
export const updateUserInfo = catchAsync(async (req, res) => {
  const { user } = req;
  const { email, mobileNumber, countryCodeId, ...otherFields } = req.body;

  /* ---------------- NORMAL FIELDS ---------------- */
  if (Object.keys(otherFields).length) {
    await userService.updateUserForAuth({ _id: user._id }, otherFields, { new: true }, user);
  }

  /* ---------------- EMAIL UPDATE ---------------- */
  if (email && email !== user.email) {
    const exists = await userService.getOne({
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

    user.pendingEmail = email;
    await user.save();

    await emailService.sendOtpVerificationEmail({ email }, otp);

    return res.status(httpStatus.OK).send({
      message: 'OTP sent to email. Please verify.',
      verifyType: 'email',
    });
  }

  /* ---------------- MOBILE UPDATE ---------------- */
  if (mobileNumber && mobileNumber !== user.mobileNumber) {
    const country = await countryCodeService.getCountryCodeById(countryCodeId);
    if (!country) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Valid countryCodeId required');
    }

    const otp = generateOtp();

    user.codes.push({
      code: String(otp),
      codeType: EnumCodeTypeOfCode.MOBILE,
      expirationDate: new Date(Date.now() + 10 * 60 * 1000),
      used: false,
    });

    user.pendingMobileNumber = mobileNumber;
    user.pendingCountryCode = country.code;

    await user.save();

    await sendOtpToMobile(`${country.code}${mobileNumber}`, otp);

    return res.status(httpStatus.OK).send({
      message: 'OTP sent to mobile. Please verify.',
      verifyType: 'mobile',
    });
  }

  return res.status(httpStatus.OK).send({
    message: 'Profile updated successfully',
  });
});

export const sendVerifyOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();
  const user = await userService.getOne({ email });
  if (!user) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'no user found with this id!');
  }
  if (user.emailVerified) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'your email is already verified!');
  }
  user.codes.push({
    code: otp,
    expirationDate: Date.now() + 10 * 60 * 1000,
    used: false,
    codeType: EnumCodeTypeOfCode.LOGIN,
  });
  await user.save();
  await emailService.sendOtpVerificationEmail(user, otp).then().catch();
  res.status(httpStatus.OK).send({
    results: {
      success: true,
      message: 'Email has been sent to your registered email. Please check your email and verify it',
    },
  });
});

export const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.status(httpStatus.OK).send({ results: { ...tokens } });
});

export const logout = catchAsync(async (req, res) => {
  const { user } = req;
  const { deviceToken } = req.body;
  if (deviceToken) {
    user.deviceTokens = user.deviceTokens.filter((token) => token !== deviceToken);
    await user.save();
  }
  await tokenService.invalidateToken(req.body);
  res.status(httpStatus.OK).send({ results: { success: true } });
});

export const socialLogin = catchAsync(async (req, res) => {
  const user = await authService.socialLogin(req.user);
  const token = await tokenService.generateAuthTokens(req.user);
  res.status(httpStatus.OK).send({ results: { user, token } });
});

export const registerDeviceToken = catchAsync(async (req, res) => {
  const { user, body } = req;
  if (body.deviceToken) {
    const updatedUser = await userService.addDeviceToken(user, body);
    res.status(httpStatus.OK).send({ results: updatedUser });
  } else {
    res.status(httpStatus.OK).send({ results: user });
  }
});

export const updateDeviceToken = catchAsync(async (req, res) => {
  const { user, body } = req;
  const { deviceToken } = req.body;
  if (deviceToken) {
    const updatedUser = await userService.addDeviceToken(user, body);
    res.status(httpStatus.OK).send({ results: updatedUser });
  } else {
    res.status(httpStatus.OK).send({ results: user });
  }
});

export const verifyUpdateOtp = catchAsync(async (req, res) => {
  const { user } = req;
  const { otp, type } = req.body;

  const otpCode = user.codes.find(
    (c) => c.code === String(otp) && c.codeType === type && !c.used && c.expirationDate > new Date()
  );

  if (!otpCode) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid or expired OTP');
  }

  otpCode.used = true;

  // ✅ APPLY VERIFIED DATA
  if (type === EnumCodeTypeOfCode.EMAIL) {
    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.emailVerified = true;
  }

  if (type === EnumCodeTypeOfCode.MOBILE) {
    user.mobileNumber = user.pendingMobileNumber;
    user.countryCode = user.pendingCountryCode;
    user.pendingMobileNumber = null;
    user.pendingCountryCode = null;
    user.isMobileVerifed = true;
  }

  await user.save();

  return res.status(httpStatus.OK).send({
    message: 'OTP verified & profile updated successfully',
    user,
  });
});
