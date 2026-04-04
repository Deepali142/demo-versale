export const VALID_DESTINATIONS = [
  "COUPON",
  "AD",
  "HOME",
  "PARTNER",
  "HOW_IT_WORK",
  "STERILIZATION"
] as const;

export const VALID_APP_TYPES = ["USER", "TECHNICIAN"] as const;

export const VALID_MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;

export type Destination = (typeof VALID_DESTINATIONS)[number];
export type AppType = (typeof VALID_APP_TYPES)[number];
export type MediaType = (typeof VALID_MEDIA_TYPES)[number];

import mongoose from "mongoose";

export type HomeBannerPlain = {
  _id: mongoose.Types.ObjectId; 

  appType: AppType;

  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;

  destination: Destination;

  section?: "TOP" | "MIDDLE" | "BOTTOM"; 

  order?: number;     
  position?: number;  

  data?: Record<string, any>; 

  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
};