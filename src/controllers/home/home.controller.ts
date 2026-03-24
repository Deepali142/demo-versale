import { Request, Response } from "express";
import { getHomeScreenService } from "../../services/home/home.service";

// --------------------
// TYPES
// --------------------
const validTypes = ["USER", "TECHNICIAN"] as const;
type AppType = (typeof validTypes)[number];

// Type Guard (BEST PRACTICE)
const isValidAppType = (type: unknown): type is AppType => {
  return typeof type === "string" && validTypes.includes(type as AppType);
};

// --------------------
// GET HOME SCREEN
// --------------------
export const getHomeScreen = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { type } = req.query;

    // Validate presence
    if (!type) {
      return res.status(400).json({
        success: false,
        message: "type is required (USER or TECHNICIAN)",
      });
    }

    // Validate type safely
    if (!isValidAppType(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

    // Now TS knows it's AppType ✅
    const data = await getHomeScreenService(type);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: "Failed to load home screen",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
