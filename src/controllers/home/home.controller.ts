import { Request, Response } from "express";
import { getHomeScreenService } from "../../services/home/home.service";

// controllers/homeConfig/homeConfig.controller.ts
import {
  createHomeConfigService,
  getHomeConfigListService,
  getHomeConfigByIdService,
  updateHomeConfigService,
  deleteHomeConfigService,
} from "../../services/home/home.service";

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
    let { type, screen } = req.query;

    if (!isValidAppType(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type",
      });
    }

    if (screen === "REPAIR") {
      screen = "STERILIZATION";
    }

    if(screen === "INSTALLATION"){
      screen = "STERILIZATION";
    }

    const data = await getHomeScreenService(
      type,
      screen as Screen,
    );

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error: unknown) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to load home screen",
    });
  }
};


// --------------------
// CREATE
// --------------------
export const createHomeConfig = async (req: Request, res: Response) => {
  try {
    const data = await createHomeConfigService(req.body);

    return res.status(201).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------
// LIST
// --------------------
export const getHomeConfigList = async (req: Request, res: Response) => {
  try {
    const { appType, screen } = req.query;

    const data = await getHomeConfigListService({
      appType: appType as any,
      screen: screen as any,
    });

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch configs",
    });
  }
};

// --------------------
// GET BY ID
// --------------------
export const getHomeConfigById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Missing id param",
      });
    }

    const data = await getHomeConfigByIdService(id);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------
// UPDATE
// --------------------
export const updateHomeConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Missing id param",
      });
    }

    const data = await updateHomeConfigService(id, req.body);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: any) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// --------------------
// DELETE
// --------------------
export const deleteHomeConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
     if (!id) {
      return res.status(400).json({
        success: false,
        message: "Missing id param",
      });
    }


    const data = await deleteHomeConfigService(id);

    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (error: any) {
    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
