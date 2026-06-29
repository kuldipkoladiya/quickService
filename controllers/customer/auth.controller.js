import httpStatus from 'http-status';
import { generateOtp } from 'utils/common';
import ApiError from 'utils/ApiError';
import { catchAsync } from 'utils/catchAsync';
import { authService, tokenService, userService, emailService, countryCodeService } from 'services';

import { EnumTypeOfToken, EnumCodeTypeOfCode } from 'models/enum.model';
import { sendOtpToMobile } from '../../services/mobileotp.service';

export const registerCustomer = catchAsync(async (req, res) => {
  const { body } = req;
  const { email, mobileNumber, countryCodeId } = body;

  let user;

  // 🔍 Find user by email or mobile
  if (email) {
    user = await userService.getOne({ email });
  } else if (mobileNumber) {
    user = await userService.getOne({ mobileNumber });
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
  const user = await userService.createUser(body);
  const emailVerifyToken = await tokenService.generateVerifyEmailToken(user.email);
  emailService.sendEmailVerificationEmail(user, emailVerifyToken, 'customer').then().catch();
  res.status(httpStatus.OK).send({
    results: {
      success: true,
      message: 'Email has been sent to your registered email. Please check your email and verify it',
      user,
    },
  });
});
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { deviceToken } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
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
  const { email } = req.body;
  const emailVerifyToken = await tokenService.generateVerifyEmailToken(email);
  const user = await userService.getOne({ email });
  emailService.sendEmailVerificationEmail(user, emailVerifyToken, 'customer').then().catch();
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
  const { email } = req.body;
  await authService.forgotPassword(email);
  res.status(httpStatus.OK).send({ results: { success: true, message: 'Code has been sent' } });
});

/**
 * Token-based forgotPassword Controller
 * @type {(function(*, *, *): void)|*}
 */
export const forgotPasswordToken = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
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
