import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name?: string;
  isActive?: boolean;
  type: "RETAIL" | "HNI" | "SME" | "LARGE_SCALE";
  phoneNumber: string;
  countryCode: string;
  otp?: number;
  otpExpiryTime?: string;
  refreshToken?: string | undefined;
  isOtpVerify?: number;
  loyaltyPoints?: number;
  deviceToken?: string;
  email?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    type: {
      type: String,
      enum: ["RETAIL", "HNI", "SME", "LARGE_SCALE"],
      default: "RETAIL",
      // required: true,
    },
    phoneNumber: {
      type: String,
      unique: true,
      required: true,
      length: 10,
    },
    countryCode: {
      type: String,
      required: true,
    },
    otp: {
      type: Number,
    },
    otpExpiryTime: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    isOtpVerify: {
      type: Number,
      default: 0,
    },
    loyaltyPoints: {
      type: Number,
      default: 0,
    },
    deviceToken: {
      type: String,
      default: "",
    },
    email: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// (compound unique index to prevent duplicates per country)
userSchema.index({ countryCode: 1, phoneNumber: 1 }, { unique: true });
const User = mongoose.model<IUser>("User", userSchema);
export default User;
