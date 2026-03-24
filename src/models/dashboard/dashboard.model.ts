import { Schema, model, Document } from "mongoose";

export interface IDashboardItem extends Document {
  name: string;
  iconUrl: string;

  // grouping (IMPORTANT)
  section: "QUICK_SERVICES" | "BOOKING" | "OTHER";

  // optional UI title (for section heading)
  sectionTitle?: string;

  appType: "USER" | "TECHNICIAN";
  position: number;

  isActive: boolean;

  // optional future use
  actionType?: "NAVIGATE" | "API";
  actionValue?: string;
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
    },

    // NEW: section
    section: {
      type: String,
      enum: ["QUICK_SERVICES", "BOOKING", "OTHER"],
      required: true,
    },

    //  NEW: section title (optional)
    sectionTitle: {
      type: String,
      trim: true,
    },

    appType: {
      type: String,
      enum: ["USER", "TECHNICIAN"],
      required: true,
    },

    position: {
      type: Number,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // future ready
    actionType: {
      type: String,
      enum: ["NAVIGATE", "API"],
    },
    actionValue: {
      type: String,
    },
  },
  { timestamps: true },
);

export const DashboardItem = model<IDashboardItem>(
  "DashboardItem",
  DashboardItemSchema,
);
