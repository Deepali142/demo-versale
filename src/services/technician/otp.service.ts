import TechnicianOtp from "../../models/technician/otp.model";
import { generateOTP } from "../../utils/generateotp";
import { sendOtpSms } from "../../utils/sendotp";
import Technician from "../../models/technician/technician.model";

export const createOtp = async (
  technicianId: string,
  phoneNumber: string,
): Promise<string> => {
  // Check technician exists
  const technician = await Technician.findById(technicianId);
  if (!technician) throw new Error("technician not found");
  console.log(
    "Creating OTP for technician:",
    technicianId,
    "Phone:",
    phoneNumber,
  );

  // remove any existing OTPs for this technician (handles resend too)
  await TechnicianOtp.deleteMany({ technicianId });

  // generate new OTP
  const code = generateOTP();

  // save OTP in DB
  await TechnicianOtp.create({ technicianId: technicianId, otp: code });

  // send via Twilio
  await sendOtpSms(phoneNumber, code);

  console.log(`OTP for technicianId ${technicianId}: ${code}`);
  return code;
};

export const verifyOtp = async (
  technicianId: string,
  otp: string,
): Promise<boolean> => {
  // Check technician exists
  const technician = await Technician.findById(technicianId);
  if (!technician) throw new Error("technician not found");

  const otpRecord = await TechnicianOtp.findOne({
    technicianId: technicianId,
    otp,
  });

  if (!otpRecord) {
    throw new Error("Invalid or expired OTP");
  }

  // Temporarily disable delete OTP
  // once verified, delete OTP
  // await Otp.deleteOne({ _id: otpRecord._id });

  return true;
};
