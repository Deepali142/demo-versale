import {
  HomeBanner,
  IHomeBanner,
} from "../../models/homeBanner/homeBanner.model";
import mongoose, { SortOrder, FilterQuery } from "mongoose";

export const VALID_DESTINATIONS = [
  "COUPON",
  "AD",
  "HOME",
  "PARTNER",
  "HOW_IT_WORK",
] as const;

export const VALID_APP_TYPES = ["USER", "TECHNICIAN"] as const;

export const VALID_MEDIA_TYPES = ["IMAGE", "VIDEO"] as const;

export type Destination = (typeof VALID_DESTINATIONS)[number];
export type AppType = (typeof VALID_APP_TYPES)[number];
export type MediaType = (typeof VALID_MEDIA_TYPES)[number];

interface SaveHomeBannerPayload {
  appType: AppType;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  destination: Destination;
  position: number;
  data?: string;
}

interface EditHomeBannerPayload {
  appType?: AppType;
  mediaType?: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  destination?: Destination;
  position?: number;
  data?: string;
  isActive?: boolean;
}

export interface GetHomeBannerParams {
  appType?: AppType;
  destination?: Destination;
  sortField?: "position" | "createdAt" | "updatedAt";
  sortOrder?: SortOrder;
}

// ================== SERVICES ==================

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

  return await HomeBanner.findByIdAndUpdate(
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
  sortField = "position",
  sortOrder = 1,
}: GetHomeBannerParams): Promise<IHomeBanner[]> => {
  const allowedSortFields = ["position", "createdAt", "updatedAt"] as const;

  const finalSortField = allowedSortFields.includes(sortField)
    ? sortField
    : "position";

  const sortObj: Record<string, SortOrder> = {
    [finalSortField]: sortOrder,
  };

  const filter: FilterQuery<IHomeBanner> = {
    isActive: true,
    ...(appType && { appType }),
    ...(destination && { destination }),
  };

  const banners = await HomeBanner.find(filter)
    .sort(sortObj)
    .lean<IHomeBanner[]>();

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

  const updatedBanner = await HomeBanner.findByIdAndUpdate(
    bannerId,
    [
      {
        $set: {
          isActive: { $not: "$isActive" },
        },
      },
    ],
    { new: true },
  );

  if (!updatedBanner) {
    throw new Error("Banner not found");
  }

  return updatedBanner;
};
