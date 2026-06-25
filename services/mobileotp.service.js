import config from 'config/config';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';

const axios = require('axios');

// Function to send OTP via MSG91
// eslint-disable-next-line import/prefer-default-export
export const sendOtpToMobile = async (mobileNumber, otp) => {
  const msg91AuthKey = config.mobileOtp.msg91_auth; // Your MSG91 auth key
  const msg91TemplateId = config.mobileOtp.msg91_template; // Your MSG91 template ID

  // console.log('=== var mobileNumber ===>', mobileNumber);
  const url = `https://control.msg91.com/api/v5/otp?template_id=${msg91TemplateId}&mobile=${mobileNumber}&authkey=${msg91AuthKey}&realTimeResponse=1`;

  const data = {
    OTP: otp,
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/JSON',
      },
    });
    console.log('OTP sent successfully via MSG91:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error sending OTP via MSG91:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export const resendOtpToMobile = async (mobileNumber) => {
  const msg91AuthKey = config.mobileOtp.msg91_auth; // Your MSG91 auth key
  const retryType = 'text'; // Type of retry, could also be 'voice'

  const url = `https://control.msg91.com/api/v5/otp/retry?authkey=${msg91AuthKey}&retrytype=${retryType}&mobile=${mobileNumber}`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Content-Type': 'application/JSON',
      },
    });
    console.log('OTP resend successful via MSG91:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error resending OTP via MSG91:', error.response ? error.response.data : error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error resending OTP to mobile');
  }
};
