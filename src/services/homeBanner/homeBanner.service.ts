import {
  HomeBanner,
  IHomeBanner,
} from "../../models/homeBanner/homeBanner.model";
import mongoose, { SortOrder, FilterQuery } from "mongoose";

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

export type Destination = (typeof VALID_DESTINATIONS)[number];
export type AppType = (typeof VALID_APP_TYPES)[number];
export type MediaType = (typeof VALID_MEDIA_TYPES)[number];

/* ================= TYPES ================= */

interface SaveHomeBannerPayload {
  appType: AppType;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  destination: Destination;
  position: number;
  section?: "TOP" | "MIDDLE" | "BOTTOM";
  data?: string;
  order: number;
}

interface EditHomeBannerPayload {
  appType?: AppType;
  mediaType?: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  destination?: Destination;
  position?: number;
  data?: string;
  order?: number | undefined;
  section?: "TOP" | "MIDDLE" | "BOTTOM";
  isActive?: boolean;
}

export interface GetHomeBannerParams {
  appType?: AppType;
  destination?: Destination;
  sortField?: "position" | "createdAt" | "updatedAt";
  sortOrder?: SortOrder;
}

export type HomeBannerPlain = {
  _id: mongoose.Types.ObjectId;
  appType: AppType;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  destination: Destination;
  position: number;
  data?: string;
  isActive: boolean;
  section?: "TOP" | "MIDDLE" | "BOTTOM";
  createdAt?: Date;
  order?: number;
  updatedAt?: Date;
};

/* Lean type (IMPORTANT) */
type HomeBannerLean = Omit<IHomeBanner, keyof Document>;

/* ================= SERVICES ================= */

export const saveHomeBannerService = async (
  payload: SaveHomeBannerPayload,
): Promise<IHomeBanner> => {
  const banner = new HomeBanner(payload);
  await banner.save();
  return banner;
};

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

export const getHomeBannerListService = async ({
  appType,
  destination,
  section,
  sortField = "position",
  sortOrder = 1,
}: GetHomeBannerParams & {
  section?: "TOP" | "MIDDLE" | "BOTTOM";
}): Promise<HomeBannerPlain[]> => {
  const allowedSortFields = [
    "position",
    "order",
    "createdAt",
    "updatedAt",
  ] as const;

  type SortField = (typeof allowedSortFields)[number];

  const finalSortField: SortField = allowedSortFields.includes(
    sortField as SortField,
  )
    ? (sortField as SortField)
    : "position";

  const sortObj: Record<string, SortOrder> =
    finalSortField === "position"
      ? { position: 1, order: 1 } // secondary sort
      : { [finalSortField]: sortOrder };

  const filter: FilterQuery<IHomeBanner> = {
    isActive: true,
  };

  if (appType) filter.appType = appType;
  if (destination) filter.destination = destination; 
  if (section) filter.section = section;

  const banners = await HomeBanner.find(filter)
    .sort(sortObj)
    .lean()
    .exec();

  return banners as unknown as HomeBannerPlain[];
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
