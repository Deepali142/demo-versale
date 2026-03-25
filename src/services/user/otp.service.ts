import UserOtp from "../../models/user/otp.model";
import User from "../../models/user/user.model";
import { generateRandom4Digit, sendOTPSMS } from "../../utils/common";

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

  const isDevelopment = process.env.NODE_ENV === "development";
  const isDemoNumber = phoneNumber === process.env.PHONE_NUMBER;

  const code: string =
    isDevelopment || isDemoNumber
      ? (process.env.DEMO_OTP ?? "1111")
      : generateRandom4Digit().toString();

  // save OTP in DB
  await UserOtp.create({ userId: userId, otp: code });

  if (!isDevelopment && !isDemoNumber) {
    await sendOTPSMS(phoneNumber, code);
  }

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
