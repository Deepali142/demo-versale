import { Schema, model, Document } from "mongoose";

// 1. Interface for Partner
export interface IPartner extends Document {
  name: string;
  logo?: string;
  isActive: boolean; // changed to boolean
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Schema definition
const partnerSchema = new Schema<IPartner>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    logo: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true, // boolean default
    },
  },
  {
    timestamps: true,
  },
);

// 3. Model
const Partner = model<IPartner>("Partner", partnerSchema);

export default Partner;
