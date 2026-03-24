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

type EditHomeBannerPayload = {
  appType?: AppType;
  mediaType?: MediaType;
  mediaUrl?: string;
  thumbnailUrl?: string;
  destination?: Destination;
  position?: number;
  data?: string;
  isActive?: boolean;
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
    } = req.body as {
      appType?: AppType;
      mediaType?: MediaType;
      mediaUrl?: string;
      thumbnailUrl?: string;
      destination?: Destination;
      position?: number;
      data?: string;
    };

    // ✅ Validation
    if (
      !appType ||
      !VALID_APP_TYPES.includes(appType) ||
      !mediaType ||
      !mediaUrl ||
      !destination ||
      !VALID_DESTINATIONS.includes(destination) ||
      position === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing required fields",
      });
    }

    const result = await saveHomeBannerService({
      appType,
      mediaType,
      mediaUrl,
      ...(thumbnailUrl && { thumbnailUrl }),
      ...(data && { data }),
      destination,
      position,
    });

    return res.status(201).json({
      success: true,
      message: "Home banner saved successfully",
      data: result,
    });
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : "Unexpected error occurred";

    if (errMsg.includes("duplicate key")) {
      return res.status(400).json({
        success: false,
        message:
          "Banner already exists at this position for this appType & destination",
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
    } = req.body as EditHomeBannerPayload;

    // ✅ Validate enums if provided
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

    const payload: EditHomeBannerPayload = {
      ...(appType && { appType }),
      ...(mediaType && { mediaType }),
      ...(mediaUrl && { mediaUrl }),
      ...(thumbnailUrl && { thumbnailUrl }),
      ...(destination && { destination }),
      ...(position !== undefined && { position }),
      ...(data !== undefined && { data }),
      ...(isActive !== undefined && { isActive }),
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

    if (errMsg.includes("duplicate key")) {
      return res.status(400).json({
        success: false,
        message:
          "Banner already exists at this position for this appType & destination",
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
    const { sortby, orderby, appType, destination } = req.query as {
      sortby?: string;
      orderby?: string;
      appType?: AppType;
      destination?: string;
    };

    const sortField: GetHomeBannerParams["sortField"] =
      sortby === "createdAt" || sortby === "updatedAt" ? sortby : "position";

    const sortOrder: 1 | -1 = orderby === "desc" ? -1 : 1;

    if (appType && !VALID_APP_TYPES.includes(appType)) {
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

    const payload: GetHomeBannerParams = {
      sortField,
      sortOrder,
      ...(appType && { appType }),
      ...(typedDestination && { destination: typedDestination }),
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
