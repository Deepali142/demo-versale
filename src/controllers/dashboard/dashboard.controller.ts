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

const validSections = ["QUICK_SERVICES", "BOOKING", "OTHER", "REQUEST" , "UTILITIES"] as const;
type Section = (typeof validSections)[number];

const validActionTypes = ["NAVIGATE", "API"] as const;
type ActionType = (typeof validActionTypes)[number];

// --------------------
// HELPERS
// --------------------
const isValidEnum = <T>(value: any, validArray: readonly T[]): value is T => {
  return validArray.includes(value);
};

// --------------------
// GET
// --------------------
export const getDashboardItems = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { appType } = req.query;

    let typedAppType: AppType | undefined;

    if (appType) {
      if (!isValidEnum(appType, validAppTypes)) {
        return res.status(400).json({
          success: false,
          message: "Invalid appType",
        });
      }
      typedAppType = appType;
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
  res: Response
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
      screen,
      serviceId,
      parentId,
    } = req.body;

    if (!name || !iconUrl || !appType || !section || position === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!isValidEnum(appType, validAppTypes)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appType",
      });
    }

    if (!isValidEnum(section, validSections)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section",
      });
    }

    if (actionType && !isValidEnum(actionType, validActionTypes)) {
      return res.status(400).json({
        success: false,
        message: "Invalid actionType",
      });
    }

    if (!actionType && !serviceId) {
      return res.status(400).json({
        success: false,
        message: "Either actionType or serviceId is required",
      });
    }

    if (actionType === "SERVICE" && !serviceId) {
      return res.status(400).json({
        success: false,
        message: "serviceId is required when actionType is SERVICE",
      });
    }

    if (
      (actionType === "NAVIGATE" || actionType === "API") &&
      !actionValue
    ) {
      return res.status(400).json({
        success: false,
        message: "actionValue is required for NAVIGATE or API",
      });
    }

    const result = await createDashboardItemService({
      name,
      iconUrl,
      appType,
      section,
      position,

      ...(screen && { screen }),
      ...(sectionTitle && { sectionTitle }),
      ...(parentId && { parentId }),
      ...(serviceId && { serviceId }),
      ...(actionType && { actionType }),
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
  res: Response
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
      screen,
      serviceId,
      parentId,
    } = req.body;

    if (appType && !isValidEnum(appType, validAppTypes)) {
      return res.status(400).json({
        success: false,
        message: "Invalid appType",
      });
    }

    if (section && !isValidEnum(section, validSections)) {
      return res.status(400).json({
        success: false,
        message: "Invalid section",
      });
    }

    if (actionType && !isValidEnum(actionType, validActionTypes)) {
      return res.status(400).json({
        success: false,
        message: "Invalid actionType",
      });
    }

    if (actionType === "SERVICE" && !serviceId) {
      return res.status(400).json({
        success: false,
        message: "serviceId is required when actionType is SERVICE",
      });
    }

    if (
      (actionType === "NAVIGATE" || actionType === "API") &&
      !actionValue
    ) {
      return res.status(400).json({
        success: false,
        message: "actionValue is required for NAVIGATE or API",
      });
    }

    const payload: Record<string, unknown> = {
      ...(name && { name }),
      ...(iconUrl && { iconUrl }),
      ...(section && { section }),
      ...(sectionTitle && { sectionTitle }),
      ...(appType && { appType }),
      ...(position !== undefined && { position }),
      ...(actionType && { actionType }),
      ...(actionValue && { actionValue }),
      ...(isActive !== undefined && { isActive }),

      ...(screen && { screen }),
      ...(serviceId && { serviceId }),
      ...(parentId && { parentId }),
    };

    if (!Object.keys(payload).length) {
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
  res: Response
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