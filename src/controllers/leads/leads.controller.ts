import { Request, Response } from "express";
import {
  createLeadService,
  getAdminLeadDetailsService,
  getAdminLeadListService,
  getUserLeadDetailsService,
  getUserLeadListService,
} from "../../services/leads/leads.service";

export const createLead = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { place, quantity, userId, comment } = req.body as unknown as {
      place: string;
      quantity: number;
      userId: string;
      comment?: string;
    };

    await createLeadService(place, quantity, userId, comment);

    return res.status(201).json({
      success: true,
      message: "Lead created successfully",
    });
  } catch (error: unknown) {
    const err = error as Error;

    return res.status(400).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }
};

export const getUserLeadDetails = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;

    if (!leadId || leadId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Lead id is required",
        data: {},
      });
    }

    const leadDetails = await getUserLeadDetailsService(leadId);

    if (!leadDetails) {
      return res.status(200).json({
        success: false,
        message: "Lead not found",
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      data: leadDetails,
    });
  } catch (error: unknown) {
    console.error("Error finding lead:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong on the server",
    });
  }
};

export const getUserLeadList = async (req: Request, res: Response) => {
  try {
    // const userId = req.params.userId;
    const userId = (req as unknown as { userId: string }).userId;

    if (!userId || userId.trim() === "") {
      return res.status(400).json({
        success: "fail",
        message: "User ID is required",
      });
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const { leads, totalLeads } = await getUserLeadListService(
      userId,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      data: leads,
      count: totalLeads,
      page,
      limit,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const getAdminLeadList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const search = (req.query.search as string) || "";
    const sortField = (req.query.sortby as string) || "createdAt";
    const sortOrder = req.query.orderby === "asc" ? 1 : -1; // default desc

    const { leads, totalLeads } = await getAdminLeadListService(
      page,
      limit,
      search,
      sortField,
      sortOrder,
    );

    return res.status(200).json({
      success: true,
      data: leads,
      count: totalLeads,
      page,
      limit,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const getAdminLeadDetails = async (req: Request, res: Response) => {
  try {
    const { leadId } = req.params;
    if (!leadId || leadId.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Lead id is required",
        data: {},
      });
    }

    const lead = await getAdminLeadDetailsService(leadId);

    if (!lead) {
      return res.status(200).json({
        success: false,
        message: "Lead not found",
        data: {},
      });
    }

    return res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};
