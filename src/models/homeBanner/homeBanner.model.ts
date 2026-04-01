import { Schema, model, Document } from "mongoose";

export interface IHomeBanner extends Document {
  appType: "USER" | "TECHNICIAN";
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  thumbnailUrl?: string;
  section: "TOP" | "MIDDLE" | "BOTTOM";
  destination: "COUPON" | "AD" | "HOME" | "PARTNER" | "HOW_IT_WORK" | "STERILIZATION";
  position: number;
  data?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  order: number;
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
      default: "TOP",
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

    order: {  type: Number, required: true, default: 0 },

    destination: {
      type: String,
      enum: ["COUPON", "AD", "HOME", "PARTNER", "HOW_IT_WORK","STERILIZATION"],
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

// HomeBannerSchema.index(
//   { destination: 1, position: 1 },
//   { unique: false },
// );

export const HomeBanner = model<IHomeBanner>("HomeBanner", HomeBannerSchema);
