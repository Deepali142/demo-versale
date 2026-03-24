import Admin from "../../models/admin/admin.model";
import * as otpService from "../admin/otp.service";
import { IAdmin } from "../../models/admin/admin.model";
import { getFolderPath } from "../../utils/common";
import AWS from "aws-sdk";
const s3 = new AWS.S3();

export interface GeneratePresignedUrlPayload {
  fileName: string;
  fileType: string;
  type: string;
}

export interface GeneratePresignedUrlResponse {
  presignedUrl: string;
  filePath: string;
}

export const createAdmin = async (countryCode: string, phoneNumber: string) => {
  phoneNumber = phoneNumber.trim();

  // Check if admin already exists
  const admin = await Admin.findOne({ countryCode, phoneNumber });
  if (admin) throw new Error("Admin already registered");

  const newAdmin = new Admin({
    countryCode,
    phoneNumber,
    status: "pending",
    role: "admin",
  });
  await newAdmin.save();

  // Create new admin with "pending" status
  const fullPhone = countryCode.startsWith("+")
    ? `${countryCode}${phoneNumber}`
    : `+${countryCode}${phoneNumber}`;

  // Send OTP
  await otpService.createOtp(String(newAdmin._id), fullPhone);

  return newAdmin;
};

export const loginAdmin = async (countryCode: string, phoneNumber: string) => {
  phoneNumber = phoneNumber.trim();

  const admin = await Admin.findOne({ countryCode, phoneNumber });
  if (!admin) throw new Error("Admin not found");

  const fullPhone = admin.countryCode?.startsWith("+")
    ? `${admin.countryCode}${admin.phoneNumber}`
    : `+${admin.countryCode}${admin.phoneNumber}`;

  await otpService.createOtp(String(admin._id), fullPhone);

  return admin;
};

export const fetchAdmins = async () => {
  return await Admin.find();
};

export const fetchAdminById = async (id: string) => {
  const admin = await Admin.findById(id);
  if (!admin) throw new Error("Admin not found");
  return admin;
};

export const updateAdminById = async (
  id: string,
  updateData: Partial<IAdmin>,
) => {
  const admin = await Admin.findByIdAndUpdate(id, updateData, { new: true });
  if (!admin) throw new Error("Admin not found");
  return admin;
};

export const deleteAdminById = async (id: string) => {
  const admin = await Admin.findByIdAndDelete(id);
  if (!admin) throw new Error("Admin not found");
  return admin;
};

export interface GeneratePresignedUrlPayload {
  fileName: string;
  fileType: string;
  type: string;
}

export interface GeneratePresignedUrlResponse {
  presignedUrl: string;
  filePath: string;
}

export const generatePresignedUrlService = async (
  payload: GeneratePresignedUrlPayload,
): Promise<GeneratePresignedUrlResponse> => {
  const { fileName, fileType, type } = payload;

  const bucketName = process.env.BUCKET_NAME;

  if (!bucketName) {
    throw new Error("Bucket name is not configured");
  }

  const folderPath = getFolderPath(type);
  const fullPath = `${folderPath}/${fileName}`;

  const presignedUrl = await s3.getSignedUrlPromise("putObject", {
    Bucket: bucketName,
    Key: fullPath,
    ContentType: fileType,
    Expires: 600,
  });

  return {
    presignedUrl,
    filePath: fullPath,
  };
};
