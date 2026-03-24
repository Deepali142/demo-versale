import { Schema, model, Document } from "mongoose";

export enum ServiceCategory {
  BASIC = "BASIC",
  GAS_CHG = "GAS_CHG",
  COPPER_PIPING = "COPPER_PIPING",
  AMC = "AMC",
  COMM_AC = "COMM_AC",
  OTHER = "OTHER",
}

export interface IBannerImage {
  type?: string;
  url?: string;
}

export interface IService extends Document {
  name: string;
  icon?: string;
  isActive: boolean;
  orderBy: number;
  description: Record<string, unknown>[];
  terms: Record<string, unknown>[];
  banner_images: IBannerImage[];
  category: ServiceCategory;
  key?: string;
  position: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, index: true, required: true },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
    orderBy: { type: Number, default: 0 },
    description: { type: [Object], default: [] },
    terms: { type: [Object], default: [] },
    banner_images: [
      {
        type: {
          type: String,
        },
        url: {
          type: String,
        },
      },
    ],
    category: {
      type: String,
      enum: Object.values(ServiceCategory),
      required: true,
    },
    key: { type: String },
    position: { type: Number, default: -1 },
  },
  { timestamps: true },
);

export const Service = model<IService>("Service", serviceSchema);
