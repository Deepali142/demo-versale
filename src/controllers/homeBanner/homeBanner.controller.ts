import { Request, Response } from "express";
import {
  deleteHomeBannerService,
  editHomeBannerService,
  getHomeBannerListService,
  saveHomeBannerService,
  VALID_APP_TYPES,
  VALID_DESTINATIONS,
  AppType,
  Destination,
  MediaType,
  toggleBannerStatusService,
} from "../../services/homeBanner/homeBanner.service";

// ================== TYPES ==================

type BannerSection = "TOP" | "MIDDLE" | "BOTTOM";
type BannerDisplay = "CAROUSEL" | "STATIC" | "AUTO";

type EditHomeBannerPayload = {
  appType?: AppType;
  mediaType?: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  destination?: Destination;
  position?: number;
  data?: string;
  isActive?: boolean;
  section?: BannerSection;
  order?: number;
  bannerDisplay?: BannerDisplay;
};

interface ToggleBannerParams {
  bannerId: string;
}

// ================== CONSTANTS ==================

const VALID_SECTIONS: BannerSection[] = ["TOP", "MIDDLE", "BOTTOM"];
const VALID_MEDIA_TYPES: MediaType[] = ["IMAGE", "VIDEO"];
const VALID_BANNER_DISPLAY: BannerDisplay[] = [
  "CAROUSEL",
  "STATIC",
  "AUTO",
];

// ================== ADD ==================

export const addHomeBanner = async (req: Request, res: Response) => {
  try {
    const {
      appType,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      destination,
      position,
      data,
      section,
      bannerDisplay,
      order,
    } = req.body;

    // ✅ Validation
    if (
      !appType ||
      !VALID_APP_TYPES.includes(appType) ||
      !mediaType ||
      !VALID_MEDIA_TYPES.includes(mediaType) ||
      !mediaUrl ||
      !destination ||
      !VALID_DESTINATIONS.includes(destination) ||
      typeof position !== "number"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing required fields",
      });
    }

    const finalSection: BannerSection =
      section && VALID_SECTIONS.includes(section) ? section : "TOP";

    const finalDisplay: BannerDisplay =
      bannerDisplay && VALID_BANNER_DISPLAY.includes(bannerDisplay)
        ? bannerDisplay
        : "STATIC";

    const payload = {
      appType,
      mediaType,
      mediaUrl,
      destination,
      position,
      section: finalSection,
      bannerDisplay: finalDisplay,
      order,
      ...(thumbnailUrl && { thumbnailUrl }),
      ...(data && { data }),
    };

    const result = await saveHomeBannerService(payload);

    return res.status(201).json({
      success: true,
      message: "Home banner saved successfully",
      data: result,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Banner already exists at this position for this appType + section",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error?.message,
    });
  }
};

// ================== EDIT ==================

export const editHomeBanner = async (req: Request, res: Response) => {
  try {
    const { homeBannerId } = req.params;

    if (!homeBannerId) {
      return res.status(400).json({
        success: false,
        message: "Home banner ID is required",
      });
    }

    const {
      appType,
      mediaType,
      mediaUrl,
      thumbnailUrl,
      destination,
      position,
      data,
      isActive,
      section,
      order,
      bannerDisplay,
    } = req.body as EditHomeBannerPayload;

    // ✅ VALIDATIONS

    if (appType && !VALID_APP_TYPES.includes(appType)) {
      return res.status(400).json({ success: false, message: "Invalid appType" });
    }

    if (destination && !VALID_DESTINATIONS.includes(destination)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid destination" });
    }

    if (mediaType && !VALID_MEDIA_TYPES.includes(mediaType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid mediaType" });
    }

    if (section && !VALID_SECTIONS.includes(section)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    if (bannerDisplay && !VALID_BANNER_DISPLAY.includes(bannerDisplay)) {
      return res.status(400).json({
        success: false,
        message: "Invalid bannerDisplay",
      });
    }

    if (position !== undefined && typeof position !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "Position must be a number" });
    }

    if (order !== undefined && typeof order !== "number") {
      return res
        .status(400)
        .json({ success: false, message: "Order must be a number" });
    }

    // ✅ CLEAN PAYLOAD
    const payload: EditHomeBannerPayload = {
      ...(appType !== undefined && { appType }),
      ...(mediaType !== undefined && { mediaType }),
      ...(mediaUrl !== undefined && { mediaUrl }),
      ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      ...(destination !== undefined && { destination }),
      ...(position !== undefined && { position }),
      ...(data !== undefined && { data }),
      ...(isActive !== undefined && { isActive }),
      ...(section !== undefined && { section }),
      ...(order !== undefined && { order }),
      ...(bannerDisplay !== undefined && { bannerDisplay }),
    };

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    const updatedHomeBanner = await editHomeBannerService(
      homeBannerId,
      payload
    );

    if (!updatedHomeBanner) {
      return res.status(404).json({
        success: false,
        message: "Home banner not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Home banner updated successfully",
      data: updatedHomeBanner,
    });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate banner order for this section",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error?.message,
    });
  }
};

// ================== GET LIST ==================

export const getHomeBannerList = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { appType, destination, section, isActive } = req.query;

    if (appType && !VALID_APP_TYPES.includes(appType as AppType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appType",
      });
    }

    let typedDestination: Destination | undefined;
    if (destination) {
      if (!VALID_DESTINATIONS.includes(destination as Destination)) {
        return res.status(400).json({
          success: false,
          message: "Invalid destination",
        });
      }
      typedDestination = destination as Destination;
    }

    let typedSection: BannerSection | undefined;
    if (section) {
      if (!VALID_SECTIONS.includes(section as BannerSection)) {
        return res.status(400).json({
          success: false,
          message: "Invalid section",
        });
      }
      typedSection = section as BannerSection;
    }

    let activeFilter: boolean | undefined;
    if (isActive !== undefined) {
      activeFilter = isActive === "true";
    }

    const payload = {
      ...(appType && { appType: appType as AppType }),
      ...(typedDestination && { destination: typedDestination }),
      ...(typedSection && { section: typedSection }),
      ...(activeFilter !== undefined && { isActive: activeFilter }),
    };

    const banners = await getHomeBannerListService(payload);

    return res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching banners",
      error: error?.message,
    });
  }
};

// ================== DELETE ==================

export const deleteHomeBanner = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { bannerId } = req.params;

    if (!bannerId) {
      return res.status(400).json({
        success: false,
        message: "Banner ID is required",
      });
    }

    const isDeleted = await deleteHomeBannerService(bannerId);

    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Home banner not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Home banner deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error?.message,
    });
  }
};

// ================== TOGGLE ==================

export const toggleBannerStatusController = async (
  req: Request<ToggleBannerParams>,
  res: Response
): Promise<Response> => {
  try {
    const { bannerId } = req.params;

    const updatedBanner = await toggleBannerStatusService(bannerId);

    return res.status(200).json({
      success: true,
      message: "Banner status updated successfully",
      data: updatedBanner,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};