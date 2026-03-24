import UserOtp from "../../models/user/otp.model";
import { generateOTP } from "../../utils/generateotp";
import { sendOtpSms } from "../../utils/sendotp";
import User from "../../models/user/user.model";

export const createOtp = async (
  userId: string,
  phoneNumber: string,
): Promise<string> => {
  // Check user exists
  const user = await User.findById(userId);
  if (!user) throw new Error("user not found");
  console.log("Creating OTP for user:", userId, "Phone:", phoneNumber);

  // remove any existing OTPs for this user (handles resend too)
  await UserOtp.deleteMany({ userId });

  // generate new OTP
  const code = generateOTP();

  // save OTP in DB
  await UserOtp.create({ userId: userId, otp: code });

  // send via Twilio
  await sendOtpSms(phoneNumber, code);

  console.log(`OTP for userId ${userId}: ${code}`);
  return code;
};

export const verifyOtp = async (
  userId: string,
  otp: string,
): Promise<boolean> => {
  // Check user exists
  const user = await User.findById(userId);
  if (!user) throw new Error("user not found");

  const otpRecord = await UserOtp.findOne({ userId: userId, otp });

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP");
  }

  // Temporarily disable delete OTP
  // once verified, delete OTP
  // await Otp.deleteOne({ _id: otpRecord._id });

  return true;
};
