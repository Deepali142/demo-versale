import mongoose, { FilterQuery, SortOrder } from "mongoose";
import { HomeBanner, IHomeBanner } from "../../models/homeBanner/homeBanner.model";

/* ================= CONSTANTS ================= */

export const VALID_DESTINATIONS = [
  "COUPON",
  "AD",
  "HOME",
  "PARTNER",
  "HOW_IT_WORK",
  "STERILIZATION",
] as const;

export const VALID_APP_TYPES = ["USER", "TECHNICIAN"] as const;

export const VALID_MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;

export const VALID_LAYOUT_TYPES = ["SMALL", "BANNER"] as const;

/* ================= TYPES ================= */

export type Destination = (typeof VALID_DESTINATIONS)[number];
export type AppType = (typeof VALID_APP_TYPES)[number];
export type MediaType = (typeof VALID_MEDIA_TYPES)[number];
export type LayoutType = (typeof VALID_LAYOUT_TYPES)[number];

/* ================= PAYLOAD TYPES ================= */

interface SaveHomeBannerPayload {
  appType: AppType;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;

  destination: Destination;
  section: "TOP" | "MIDDLE" | "BOTTOM";

  layoutType: LayoutType; 

  order: number; 
  data?: string;
}

interface EditHomeBannerPayload {
  appType?: AppType;
  mediaType?: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;

  destination?: Destination;
  section?: "TOP" | "MIDDLE" | "BOTTOM";

  layoutType?: LayoutType;
  order?: number;
  data?: string;

  isActive?: boolean;
}

/* ================= QUERY PARAMS ================= */

export interface GetHomeBannerParams {
  appType?: AppType;
  destination?: Destination;
  section?: "TOP" | "MIDDLE" | "BOTTOM";

  sortOrder?: SortOrder; // default = 1
}

/* ================= RESPONSE TYPE ================= */

export type HomeBannerPlain = {
  _id: mongoose.Types.ObjectId;

  appType: AppType;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;

  destination: Destination;
  section: "TOP" | "MIDDLE" | "BOTTOM";

  layoutType: LayoutType; 
  order: number;
  data?: Record<string, any>; 

  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
};

/* ================= SERVICES ================= */

/**
 * Create Banner
 */
export const saveHomeBannerService = async (
  payload: SaveHomeBannerPayload,
): Promise<IHomeBanner> => {
  const banner = new HomeBanner(payload);
  await banner.save();
  return banner;
};

/**
 * Edit Banner
 */
export const editHomeBannerService = async (
  homeBannerId: string,
  payload: EditHomeBannerPayload,
): Promise<IHomeBanner | null> => {
  if (!mongoose.Types.ObjectId.isValid(homeBannerId)) {
    throw new Error("Invalid banner ID");
  }

  return HomeBanner.findByIdAndUpdate(
    homeBannerId,
    { $set: payload },
    {
      new: true,
      runValidators: true,
    },
  );
};

/**
 * Get Banner List
 */
export const getHomeBannerListService = async ({
  appType,
  destination,
  section,
  sortOrder = 1,
}: GetHomeBannerParams): Promise<HomeBannerPlain[]> => {
  const filter: FilterQuery<IHomeBanner> = {
    isActive: true,
  };

  if (appType) filter.appType = appType;
  if (destination) filter.destination = destination;
  if (section) filter.section = section;

  const banners = await HomeBanner.find(filter)
    .sort({ order: sortOrder })
    .lean<HomeBannerPlain[]>() 
    .exec();

  return banners;
};

export const deleteHomeBannerService = async (
  bannerId: string,
): Promise<boolean> => {
  if (!mongoose.Types.ObjectId.isValid(bannerId)) {
    throw new Error("Invalid banner ID");
  }

  const deletedBanner = await HomeBanner.findByIdAndDelete(bannerId);

  return !!deletedBanner;
};

export const toggleBannerStatusService = async (
  bannerId: string,
): Promise<IHomeBanner> => {
  if (!mongoose.Types.ObjectId.isValid(bannerId)) {
    throw new Error("Invalid bannerId");
  }

  const banner = await HomeBanner.findById(bannerId);

  if (!banner) {
    throw new Error("Banner not found");
  }

  banner.isActive = !banner.isActive;
  await banner.save();

  return banner;
};
