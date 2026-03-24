import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITechnicianOtp extends Document {
  technicianId: Types.ObjectId;
  otp: string;
  createdAt: Date;
}

const TechnicianOtpSchema: Schema = new Schema(
  {
    technicianId: {
      type: Schema.Types.ObjectId,
      ref: "Technician",
      required: true,
    },
    otp: { type: String, required: true },
    // temporarily disable auto-delete
    // createdAt: { type: Date, default: Date.now, expires: 432000 }, // auto-delete after 5 days
    // createdAt: { type: Date },
  },
  { timestamps: true },
);

export default mongoose.model<ITechnicianOtp>(
  "TechnicianOtp",
  TechnicianOtpSchema,
);
