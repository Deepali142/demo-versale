import { Schema, model, Document } from "mongoose";

export enum ServiceCategory {
  BASIC = "BASIC",
  STERILIZATION = "STERILIZATION",
  REPAIR = "REPAIR",
  INSTALLATION = "INSTALLATION",
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

  parentId?: Schema.Types.ObjectId | null;
  type: "CATEGORY" | "ITEM";

  isActive: boolean;
  orderBy: number;

  description: Record<string, unknown>[];
  terms: Record<string, unknown>[];
  banner_images: IBannerImage[];

  category: ServiceCategory;

  key?: string;
  position: number;

  uiType?: "ACCORDION" | "GRID";

  unitPrice: Schema.Types.Decimal128;

  createdAt?: Date;
  updatedAt?: Date;
}

const serviceSchema = new Schema<IService>(
  {
    name: { type: String, index: true, required: true },
    icon: { type: String },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      default: null,
    },

    type: {
      type: String,
      enum: ["CATEGORY", "ITEM"],
      default: "ITEM",
    },

    isActive: { type: Boolean, default: true },
    orderBy: { type: Number, default: 0 },

    category: {
      type: String,
      enum: Object.values(ServiceCategory),
      required: true,
    },

    position: { type: Number, default: -1 },
    unitPrice: { type: Schema.Types.Decimal128, required: true, default: 0 },
  },
  { timestamps: true },
);

export const Service = model<IService>("Service", serviceSchema);
