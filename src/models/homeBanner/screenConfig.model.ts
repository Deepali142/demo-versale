import { Schema, model, Document } from "mongoose";

export type SectionKey =
  | "TOP_BANNER"
  | "SERVICE_TYPES"
  | "REQUEST"
  | "UTILITIES"
  | "MIDDLE_BANNER"
  | "PRODUCT_LIST"
  | "STERILIZATION_INFO"
  | "BOTTOM_BANNER";

export type SectionType =
  | "BANNER"
  | "DASHBOARD"
  | "PRODUCT_LIST"
  | "INFO";


export interface IHomeSection {
  key: SectionKey;
  type: SectionType;
  order: number;
  isActive: boolean;
  bannerDisplay?: "CAROUSEL" | "STATIC" | "AUTO"; 
}

export interface IHomeScreenConfig extends Document {
  appType: "USER" | "TECHNICIAN";
  screen: string;
  sections: IHomeSection[];
  bannerDisplay?: "CAROUSEL" | "STATIC" | "AUTO";
  isActive: boolean;
}

const HomeSectionSchema = new Schema<IHomeSection>(
  {
    key: {
      type: String,
      required: true,
      enum: [
        "TOP_BANNER",
        "SERVICE_TYPES",
        "MIDDLE_BANNER",
        "PRODUCT_LIST",
        "STERILIZATION_INFO",
        "BOTTOM_BANNER",
      ],
    },
    bannerDisplay: {
      type: String,
      enum: ["CAROUSEL", "STATIC", "AUTO"],
      default: "AUTO",
    },
    type: {
      type: String,
      required: true,
      enum: ["BANNER", "DASHBOARD", "PRODUCT_LIST", "INFO"],
    },
    order: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const HomeScreenConfigSchema = new Schema<IHomeScreenConfig>(
  {
    appType: {
      type: String,
      required: true,
      enum: ["USER", "TECHNICIAN"],
    },
    screen: {
      type: String,
      required: true,
    },
    sections: {
      type: [HomeSectionSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

export const HomeScreenConfig = model<IHomeScreenConfig>(
  "HomeScreenConfig",
  HomeScreenConfigSchema,
);