import { Request, Response } from "express";
import {
  createToolRequestService,
  getToolRequestListService,
  updateToolRequestStatusService,
} from "../../services/toolsAndToolBag/toolsRequest.service";

export const createToolRequest = async (req: Request, res: Response) => {
  try {
    const {
      technicianId,
      identifier,
      name,
      type = "TOOL",
      quantity,
      comment = "",
      description = "",
      reason,
    } = req.body;

    const result = await createToolRequestService({
      technicianId,
      identifier,
      name,
      type,
      quantity,
      comment,
      description,
      reason,
    });

    return res.status(201).json({
      status: "success",
      message: "Tool request submitted successfully",
      data: result,
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Create Tool Request Error:", err);

    return res.status(500).json({
      status: "fail",
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getToolRequestList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string)?.trim() || "";
    const sortby = (req.query.sortby as string) || "createdAt";

    const result = await getToolRequestListService({
      page,
      limit,
      search,
      sortby,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      count: result.total,
      pagination: {
        total: result.total,
        page,
        limit,
        totalPages: Math.ceil(result.total / limit),
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching tool request list:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: message,
    });
  }
};

export const updateToolRequestStatus = async (req: Request, res: Response) => {
  try {
    const { requestId } = req.params;
    const { status, comment } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: "Request ID is required",
      });
    }

    const updatedRequest = await updateToolRequestStatusService({
      requestId,
      status,
      ...(comment !== undefined && { comment }),
    });

    if (!updatedRequest) {
      return res.status(404).json({
        success: false,
        message: "Tool request not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tool request status updated successfully",
      data: updatedRequest,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};
