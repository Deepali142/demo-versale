import { Request, Response } from "express";
import {
  addToolBagService,
  deleteToolBagService,
  getToolBagByIdService,
  getToolBagListService,
  modifyToolInToolsBagService,
  ModifyToolPayload,
} from "../../services/toolsAndToolBag/toolsBag.service";
import {
  updateToolBagService,
  ToolBagPayload,
} from "../../services/toolsAndToolBag/toolsBag.service";
export const addToolBag = async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    const newToolBag = await addToolBagService(payload);

    return res.status(201).json({
      success: true,
      message: "Tool bag created successfully",
      data: newToolBag,
    });
  } catch (error: unknown) {
    const err = error as Error;

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const updateToolBag = async (req: Request, res: Response) => {
  try {
    const { toolsBagId } = req.params;
    const updateData: Partial<ToolBagPayload> = req.body;

    if (!toolsBagId) {
      return res.status(400).json({
        success: false,
        message: "tools bag ID is required",
      });
    }

    const toolBag = await updateToolBagService(toolsBagId, updateData);

    return res.status(200).json({
      success: true,
      message: "ToolBag updated successfully",
      data: toolBag,
    });
  } catch (error: unknown) {
    const err = error as Error;

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getToolBagList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string)?.trim() || "";

    const { toolBags, total } = await getToolBagListService(
      page,
      limit,
      search,
    );

    return res.status(200).json({
      success: true,
      message: "ToolBag list fetched successfully",
      data: toolBags,
      count: total,
    });
  } catch (error: unknown) {
    const err = error as Error;

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getToolBagById = async (req: Request, res: Response) => {
  try {
    const { toolsBagId } = req.params;

    if (!toolsBagId) {
      return res.status(400).json({
        success: false,
        message: "tools bag ID is required",
      });
    }

    const toolBag = await getToolBagByIdService(toolsBagId);

    return res.status(200).json({
      success: true,
      data: toolBag,
    });
  } catch (error: unknown) {
    const err = error as Error;

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const deleteToolBag = async (req: Request, res: Response) => {
  try {
    const { toolsBagId } = req.params;

    if (!toolsBagId) {
      return res.status(400).json({
        success: false,
        message: "tools bag ID is required",
      });
    }

    await deleteToolBagService(toolsBagId);

    return res.status(200).json({
      success: true,
      message: "ToolBag deleted successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const modifyToolInToolsBag = async (req: Request, res: Response) => {
  try {
    const { toolsBagId } = req.params;

    if (!toolsBagId) {
      return res.status(400).json({
        success: false,
        message: "Tool bag ID is required",
      });
    }

    const payload: ModifyToolPayload = {
      toolId: req.body.toolId,
      name: req.body.name,
      quantity: req.body.quantity,
      description: req.body.description,
      action: req.body.action,
    };

    const updatedToolBag = await modifyToolInToolsBagService(
      toolsBagId,
      payload,
    );

    return res.status(200).json({
      success: true,
      message:
        payload.action === "add"
          ? "Tool added to ToolBag successfully"
          : "Tool removed from ToolBag successfully",
      data: updatedToolBag,
    });
  } catch (error) {
    const msg = (error as Error).message.toLowerCase();

    // 404 Not Found
    if (msg.includes("not found")) {
      return res.status(404).json({
        success: false,
        message: (error as Error).message,
      });
    }

    // 400 Bad Request
    if (
      msg.includes("required") ||
      msg.includes("invalid") ||
      msg.includes("exists")
    ) {
      return res.status(400).json({
        success: false,
        message: (error as Error).message,
      });
    }

    // 500 Internal Error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
