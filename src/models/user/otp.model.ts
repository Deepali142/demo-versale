import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserOtp extends Document {
  userId: Types.ObjectId;
  otp: string;
  createdAt: Date;
}

const UserOtpSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: { type: String, required: true },
    // temporarily disable auto-delete
    // createdAt: { type: Date, default: Date.now, expires: 432000 }, // auto-delete after 5 days
    // createdAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model<IUserOtp>("UserOtp", UserOtpSchema);
