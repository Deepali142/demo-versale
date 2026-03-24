import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAdminOtp extends Document {
  adminId: Types.ObjectId;
  otp: string;
  createdAt: Date;
}

const AdminOtpSchema: Schema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
    otp: { type: String, required: true },
    // temporarily disable auto-delete
    // createdAt: { type: Date, default: Date.now, expires: 432000 }, // auto-delete after 5 days
    // createdAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model<IAdminOtp>("AdminOtp", AdminOtpSchema);
