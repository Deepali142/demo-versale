import { Request, Response } from "express";
import {
  adminConsultancyListService,
  adminCreateConsultancyService,
  createConsultancyService,
  getAdminConsultancyDetailsService,
  getConsultancyDetailsService,
  getUserConsultancyListService,
} from "../../services/consultancy/consultancy.service";

export const createConsultancy = async (req: Request, res: Response) => {
  try {
    const payload = {
      ...req.body,
      file: req.file, // Multer file
    };

    const result = await createConsultancyService(payload);

    return res.status(201).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const userConsultancyDetails = async (req: Request, res: Response) => {
  try {
    const { consultancyId } = req.params;

    if (!consultancyId) {
      return res.status(400).json({
        success: false,
        message: "consultancyId is required",
      });
    }

    const consultancy = await getConsultancyDetailsService(consultancyId);

    if (!consultancy) {
      return res.status(404).json({
        success: false,
        message: "Consultancy not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: consultancy._id,
        userId: consultancy.user_id,
        brand: consultancy.brandId, // populated brand { _id, name }
        quantity: consultancy.quantity,
        comment: consultancy.comment,
        place: consultancy.place,
        consultancyId: consultancy.consultancyId,
        serviceName: consultancy.serviceName,
        addressDetails: consultancy.addressDetails,
        slot: consultancy.slot,
        date: consultancy.date,
        status: consultancy.status,
        documentURL: consultancy.documentURL,
        alternatePhone: consultancy.alternatePhone,
        createdAt: consultancy.createdAt,
        updatedAt: consultancy.updatedAt,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_ID") {
      return res.status(400).json({
        success: false,
        message: "Invalid consultancyId format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const userConsultancyList = async (req: Request, res: Response) => {
  try {
    // const { userId } = req.params;
    const userId = (req as unknown as { userId: string }).userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const { list, total } = await getUserConsultancyListService(
      userId,
      page,
      limit,
    );

    return res.status(200).json({
      success: true,
      data: list,
      count: total,
      page,
      limit,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_ID") {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const adminConsultancyDetails = async (req: Request, res: Response) => {
  try {
    const { consultancyId } = req.params;

    if (!consultancyId) {
      return res.status(400).json({
        success: false,
        message: "consultancyId is required",
      });
    }

    const details = await getAdminConsultancyDetailsService(consultancyId);

    if (!details) {
      return res.status(404).json({
        success: false,
        message: "Consultancy not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "INVALID_ID") {
      return res.status(400).json({
        success: false,
        message: "Invalid consultancyId format",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const adminConsultancyList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    const sortField = (req.query.sortby as string) || "createdAt";
    // const sortOrder = req.query.orderby === "asc" ? 1 : -1;
    const sortOrder = (req.query.orderby === "asc" ? 1 : -1) as 1 | -1;

    const { list, totalCount } = await adminConsultancyListService(
      page,
      limit,
      search,
      sortField,
      sortOrder,
    );

    return res.status(200).json({
      success: true,
      data: list,
      count: totalCount,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal Server Error",
      message: "Something went wrong",
    });
  }
};

export const adminCreateConsultancy = async (req: Request, res: Response) => {
  try {
    const result = await adminCreateConsultancyService(req.body);

    return res.status(201).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const msg = error.message;

      if (msg === "INVALID_USER_ID") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid user_id" });
      }
      if (msg === "INVALID_ADDRESS_ID") {
        return res
          .status(400)
          .json({ success: false, message: "Invalid addressId" });
      }
      if (msg === "ADDRESS_NOT_FOUND") {
        return res
          .status(400)
          .json({ success: false, message: "Valid addressId required" });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
