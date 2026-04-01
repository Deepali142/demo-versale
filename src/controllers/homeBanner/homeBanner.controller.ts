import { Request, Response } from "express";
import {
  deleteHomeBannerService,
  editHomeBannerService,
  getHomeBannerListService,
  GetHomeBannerParams,
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
  order?: number | undefined;
};

interface ToggleBannerParams {
  bannerId: string;
}

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
      order,
    } = req.body as {
      appType?: AppType;
      mediaType?: MediaType;
      mediaUrl?: string;
      thumbnailUrl?: string;
      destination?: Destination;
      position?: number;
      data?: string;
      section?: BannerSection;
      order: number;
    };

    //  Allowed values
    const VALID_SECTIONS = ["TOP", "MIDDLE", "BOTTOM"];

    // Validation
    if (
      !appType ||
      !VALID_APP_TYPES.includes(appType) ||
      !mediaType ||
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

    // Section default + validation
    const finalSection: "TOP" | "MIDDLE" | "BOTTOM" =
      section && VALID_SECTIONS.includes(section) ? section : "TOP";

    // Clean payload
    const payload = {
      appType,
      mediaType,
      mediaUrl,
      destination,
      position,
      section: finalSection,
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
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Unexpected error occurred";

    // Better duplicate handling
    if (errMsg.includes("duplicate key") || (error as any)?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Banner already exists at this position for this appType + section",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: errMsg,
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
      order
    } = req.body as EditHomeBannerPayload;
    

    //  Allowed values
    const VALID_SECTIONS = ["TOP", "MIDDLE", "BOTTOM"];

    // Validate enums if provided
    if (appType && !VALID_APP_TYPES.includes(appType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appType",
      });
    }

    if (destination && !VALID_DESTINATIONS.includes(destination)) {
      return res.status(400).json({
        success: false,
        message: "Invalid destination",
      });
    }

    if (mediaType && !["IMAGE", "VIDEO"].includes(mediaType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mediaType",
      });
    }

    if (section && !VALID_SECTIONS.includes(section)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section",
      });
    }

    if (position !== undefined && typeof position !== "number") {
      return res.status(400).json({
        success: false,
        message: "Position must be a number",
      });
    }
    //  Clean payload
    const payload: EditHomeBannerPayload = {
      ...(appType && { appType }),
      ...(mediaType && { mediaType }),
      ...(mediaUrl && { mediaUrl }),
      ...(thumbnailUrl && { thumbnailUrl }),
      ...(destination && { destination }),
      ...(position !== undefined && { position }),
      ...(data !== undefined && { data }),
      ...(isActive !== undefined && { isActive }),
      ...(section && { section }),
      ...(order !== undefined && { order }),
        
    };
    

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields provided for update",
      });
    }

    const updatedHomeBanner = await editHomeBannerService(
      homeBannerId,
      payload,
    );

    if (!updatedHomeBanner) {
      return res.status(404).json({
        success: false,
        message: "Home banner not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Home banner updated successfully",
      data: updatedHomeBanner,
    });
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Unexpected error occurred";

    // Better duplicate handling
    if (errMsg.includes("duplicate key") || (error as any)?.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "Banner already exists at this position for this appType + section",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: errMsg,
    });
  }
};

// ================== GET LIST ==================

export const getHomeBannerList = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const {
      sortby,
      orderby,
      appType,
      destination,
      section,
      isActive,
    } = req.query as {
      sortby?: string;
      orderby?: string;
      appType?: AppType;
      destination?: string;
      section?: "TOP" | "MIDDLE" | "BOTTOM";
      isActive?: string;
    };

    // Sorting logic
    const sortOrder: 1 | -1 = orderby === "desc" ? -1 : 1;

    // Default sorting: position → order
    const sort: any =
      sortby === "createdAt" || sortby === "updatedAt"
        ? { [sortby]: sortOrder }
        : { position: 1, order: 1 };

    // Validate appType
    if (appType && !VALID_APP_TYPES.includes(appType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appType",
      });
    }

    // Validate destination
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

    //  Validate section
    let typedSection: "TOP" | "MIDDLE" | "BOTTOM" | undefined;
    if (section) {
      const VALID_SECTIONS = ["TOP", "MIDDLE", "BOTTOM"];
      if (!VALID_SECTIONS.includes(section)) {
        return res.status(400).json({
          success: false,
          message: "Invalid section",
        });
      }
      typedSection = section;
    }

    // Convert isActive
    let activeFilter: boolean | undefined;
    if (isActive !== undefined) {
      activeFilter = isActive === "true";
    }

    //  Build payload
    const payload: any = {
      sort,
      ...(appType && { appType }),
      ...(typedDestination && { destination: typedDestination }),
      ...(typedSection && { section: typedSection }),
      ...(activeFilter !== undefined && { isActive: activeFilter }),
    };

    const banners = await getHomeBannerListService(payload);

    return res.status(200).json({
      success: true,
      data: banners,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the home banner list.",
      error:
        error instanceof Error ? error.message : "Unexpected error occurred",
    });
  }
};

// ================== DELETE ==================

export const deleteHomeBanner = async (
  req: Request,
  res: Response,
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
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Unexpected error occurred";

    if (errMsg.includes("Invalid banner ID")) {
      return res.status(400).json({
        success: false,
        message: errMsg,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: errMsg,
    });
  }
};

export const toggleBannerStatusController = async (
  req: Request<ToggleBannerParams>,
  res: Response,
): Promise<Response> => {
  try {
    const { bannerId } = req.params;

    const updatedBanner = await toggleBannerStatusService(bannerId);

    return res.status(200).json({
      status: true,
      message: "Banner status updated successfully",
      data: updatedBanner,
    });
  } catch (error) {
    console.error("Toggle Banner Error:", error);

    return res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
