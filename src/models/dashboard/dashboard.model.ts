import { Schema, model, Document, Types } from "mongoose";

export type SectionType =
  | "QUICK_SERVICES"
  | "BOOKING"
  | "OTHER"
  | "REQUEST"
  | "UTILITIES";

export type AppType = "USER" | "TECHNICIAN";

export type ActionType = "SERVICE" | "NAVIGATE" | "API";

export interface IDashboardItem extends Document {
  name: string;
  iconUrl: string;

  section: SectionType;
  sectionTitle?: string;

  appType: AppType;
  position: number;

  isActive: boolean;

  screen: string; 

  parentId?: Types.ObjectId;

  serviceId?: Types.ObjectId;

  actionType?: ActionType;
  actionValue?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const DashboardItemSchema = new Schema<IDashboardItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    iconUrl: {
      type: String,
      required: true,
      trim: true,
    },

    section: {
      type: String,
      enum: ["QUICK_SERVICES", "BOOKING", "OTHER", "REQUEST", "UTILITIES"],
      required: true,
      index: true,
    },

    sectionTitle: {
      type: String,
      trim: true,
    },

    appType: {
      type: String,
      enum: ["USER", "TECHNICIAN"],
      required: true,
      index: true,
    },

    position: {
      type: Number,
      required: true,
      default: 0,
      index: true, 
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    screen: {
      type: String,
      required: true,
      index: true,
      default: "HOME",
    },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: "DashboardItem",
    },

    serviceId: {
      type: Schema.Types.ObjectId,
      ref: "Service",
    },

    actionType: {
      type: String,
      enum: ["SERVICE", "NAVIGATE", "API"],
    },

    actionValue: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

export const DashboardItem = model<IDashboardItem>(
  "DashboardItem",
  DashboardItemSchema,
);