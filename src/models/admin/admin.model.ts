import mongoose from "mongoose";
import { Document } from "mongoose";

export interface IAdmin extends Document {
  name: string;
  email: string;
  countryCode?: string;
  phoneNumber?: string;
  type?: number;
  role?: string;
  refreshToken?: string | undefined;
  status?: "pending" | "active" | "blocked";
  createdAt?: Date;
  _id: mongoose.Types.ObjectId;
}

const adminSchema = new mongoose.Schema<IAdmin>(
  {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    countryCode: {
      default: "+91",
      type: String,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    type: {
      type: Number,
    },
    role: {
      type: String,
    },
    refreshToken: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "active", "blocked"],
      default: "pending",
    },
  },
  { timestamps: true },
);

// (compound unique index to prevent duplicates per country)
adminSchema.index({ countryCode: 1, phoneNumber: 1 }, { unique: true });
const Admin = mongoose.model<IAdmin>("Admin", adminSchema);

// module.exports = Admin;
export default Admin;
