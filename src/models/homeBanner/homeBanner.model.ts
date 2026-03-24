import { Schema, model, Document } from "mongoose";

export interface IHomeBanner extends Document {
  appType: "USER" | "TECHNICIAN";
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  thumbnailUrl?: string;
  destination: "COUPON" | "AD" | "HOME" | "PARTNER" | "HOW_IT_WORK";
  position: number;
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

    destination: {
      type: String,
      enum: ["COUPON", "AD", "HOME", "PARTNER", "HOW_IT_WORK"],
      required: true,
    },

    position: {
      type: Number,
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

HomeBannerSchema.index(
  { appType: 1, destination: 1, position: 1 },
  { unique: true },
);

export const HomeBanner = model<IHomeBanner>("HomeBanner", HomeBannerSchema);
