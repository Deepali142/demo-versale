import { Schema, model, Document } from "mongoose";

export type BannerLayout = "SMALL" | "BANNER";

export interface IHomeBanner extends Document {
  appType: "USER" | "TECHNICIAN";

  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  thumbnailUrl?: string;

  section: "TOP" | "MIDDLE" | "BOTTOM";

  destination:
    | "COUPON"
    | "AD"
    | "HOME"
    | "PARTNER"
    | "HOW_IT_WORK"
    | "STERILIZATION";

  layoutType: BannerLayout; 

  order: number; 

  data?: string;

  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

const HomeBannerSchema = new Schema<IHomeBanner>(
  {
    appType: {
      type: String,
      enum: ["USER", "TECHNICIAN"],
      required: true,
    },

    section: {
      type: String,
      enum: ["TOP", "MIDDLE", "BOTTOM"],
      required: true,
    },

    mediaType: {
      type: String,
      enum: ["IMAGE", "VIDEO"],
      required: true,
    },

    mediaUrl: {
      type: String,
      required: true,
    },

    thumbnailUrl: {
      type: String,
    },

    layoutType: {
      type: String,
      enum: ["SMALL", "BANNER"],
      default: "BANNER",
    },

    order: {
      type: Number,
      required: true,
      default: 0,
    },

    destination: {
      type: String,
      enum: [
        "COUPON",
        "AD",
        "HOME",
        "PARTNER",
        "HOW_IT_WORK",
        "STERILIZATION",
      ],
      required: true,
    },

    data: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

HomeBannerSchema.index({ appType: 1, section: 1, order: 1 });

export const HomeBanner = model<IHomeBanner>(
  "HomeBanner",
  HomeBannerSchema,
);