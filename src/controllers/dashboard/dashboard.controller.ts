import { Request, Response } from "express";
import {
  getDashboardItemsService,
  createDashboardItemService,
  updateDashboardItemService,
  deleteDashboardItemService,
} from "../../services/dashboard/dashboard.service";

// --------------------
// TYPES
// --------------------
const validAppTypes = ["USER", "TECHNICIAN"] as const;
type AppType = (typeof validAppTypes)[number];

const validSections = ["QUICK_SERVICES", "BOOKING", "OTHER"] as const;
type Section = (typeof validSections)[number];

const validActionTypes = ["NAVIGATE", "API"] as const;
type ActionType = (typeof validActionTypes)[number];

// --------------------
// GET
// --------------------
export const getDashboardItems = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { appType } = req.query as { appType?: string };

    let typedAppType: AppType | undefined;

    if (appType) {
      if (!validAppTypes.includes(appType as AppType)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appType",
        });
      }

      typedAppType = appType as AppType;
    }

    const data = await getDashboardItemsService({
      ...(typedAppType && { appType: typedAppType }),
    });

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard items",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// --------------------
// CREATE
// --------------------
export const createDashboardItem = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const {
      name,
      iconUrl,
      appType,
      section,
      sectionTitle,
      position,
      actionType,
      actionValue,
    } = req.body as {
      name?: string;
      iconUrl?: string;
      appType?: string;
      section?: string;
      sectionTitle?: string;
      position?: number;
      actionType?: string;
      actionValue?: string;
    };

    // Required validation
    if (!name || !iconUrl || !appType || !section || position === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Validate enums
    if (!validAppTypes.includes(appType as AppType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid appType" });
    }

    if (!validSections.includes(section as Section)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    if (actionType && !validActionTypes.includes(actionType as ActionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid actionType",
      });
    }

    const result = await createDashboardItemService({
      name,
      iconUrl,
      appType: appType as AppType,
      section: section as Section,
      position,
      ...(sectionTitle && { sectionTitle }),
      ...(actionType && { actionType: actionType as ActionType }),
      ...(actionValue && { actionValue }),
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: "Failed to create dashboard item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// --------------------
// UPDATE
// --------------------
export const updateDashboardItem = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const {
      name,
      iconUrl,
      section,
      sectionTitle,
      appType,
      position,
      actionType,
      actionValue,
      isActive,
    } = req.body as {
      name?: string;
      iconUrl?: string;
      section?: string;
      sectionTitle?: string;
      appType?: string;
      position?: number;
      actionType?: string;
      actionValue?: string;
      isActive?: boolean;
    };

    // Validate enums (only if provided)
    if (appType && !validAppTypes.includes(appType as AppType)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid appType" });
    }

    if (section && !validSections.includes(section as Section)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid section" });
    }

    if (actionType && !validActionTypes.includes(actionType as ActionType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid actionType",
      });
    }

    const payload = {
      ...(name && { name }),
      ...(iconUrl && { iconUrl }),
      ...(section && { section: section as Section }),
      ...(sectionTitle && { sectionTitle }),
      ...(appType && { appType: appType as AppType }),
      ...(position !== undefined && { position }),
      ...(actionType && { actionType: actionType as ActionType }),
      ...(actionValue && { actionValue }),
      ...(isActive !== undefined && { isActive }),
    };

    if (Object.keys(payload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    const updated = await updateDashboardItemService(id, payload);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: "Failed to update item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// --------------------
// DELETE
// --------------------
export const deleteDashboardItem = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID is required",
      });
    }

    const deleted = await deleteDashboardItemService(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Deleted successfully",
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
