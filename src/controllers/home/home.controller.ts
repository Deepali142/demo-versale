import { Request, Response } from "express";
import { getHomeScreenService } from "../../services/home/home.service";

// --------------------
// TYPES
// --------------------
const validTypes = ["USER", "TECHNICIAN"] as const;
type AppType = (typeof validTypes)[number];

const validScreens = ["HOME", "STERILIZATION"] as const;
type Screen = (typeof validScreens)[number];

// Type Guard (BEST PRACTICE)
const isValidAppType = (type: unknown): type is AppType => {
  return typeof type === "string" && validTypes.includes(type as AppType);
};

const isValidScreen = (screen: unknown): screen is Screen => {
  return typeof screen === "string" && validScreens.includes(screen as Screen);
};

// --------------------
// GET HOME SCREEN
// --------------------
export const getHomeScreen = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { type, screen } = req.query as {
      type?: string;
      screen?: string;
    };

    if (!type) {
      return res.status(400).json({
        success: false,
        message: "type is required (USER or TECHNICIAN)",
      });
    }

    if (!isValidAppType(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

    let validScreen: Screen | undefined;

    if (screen) {
      if (!isValidScreen(screen)) {
        return res.status(400).json({
          success: false,
          message: "Invalid screen",
        });
      }
      validScreen = screen as Screen;
    }

    // ✅ Call service with proper types
    const data = await getHomeScreenService(
      type as AppType,
      validScreen,
    );

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
