import { Request, Response } from "express";
import {
  adminErrorCodeListService,
  adminExcelErrorCodeUploadService,
  createOrUpdateErrorCodeService,
  errorCodeListService,
} from "../../services/brand/errorCode.service";
interface ICreateEditErrorCodeBody {
  brandId: string;
  errorCodeId?: string;
  acType: string;
  models: string;
  code: string;
  solution: string[];
  description: string;
  category: "INVERTOR" | "NON_INVERTOR";
}

export const adminCreateEditErrorCode = async (
  req: Request<unknown, unknown, unknown>,
  res: Response,
) => {
  try {
    const body = req.body as unknown;

    const {
      brandId,
      errorCodeId,
      acType,
      models,
      code,
      solution,
      description,
      category,
    } = body as ICreateEditErrorCodeBody;

    if (!brandId) {
      return res
        .status(400)
        .json({ success: false, message: "brandId required" });
    }

    const response = await createOrUpdateErrorCodeService({
      brandId,
      ...(errorCodeId && { errorCodeId }),
      acType,
      models,
      code,
      solution,
      description,
      category,
    });

    return res.status(response.success ? 200 : 404).json(response);
  } catch (err) {
    console.error("Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const errorCodeList = async (req: Request, res: Response) => {
  try {
    const data = await errorCodeListService(req.body);

    if (!data) {
      return res.status(404).json({
        status: false,
        message: "Brand or error code not found",
      });
    }

    return res.status(200).json({
      status: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching error code:", error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

export const adminErrorCodeList = async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        status: false,
        message: "Brand ID is required",
      });
    }

    const query = {
      page: parseInt((req.query.page as string) || "1", 10),
      limit: parseInt((req.query.limit as string) || "10", 10),
      search: (req.query.search as string) || "",
      category: (req.query.category as string) || "",
      sortby: (req.query.sortby as string) || "",
      orderby: (req.query.orderby as string) || "asc",
    };
    const result = await adminErrorCodeListService({ brandId }, query);

    return res.status(200).json({
      status: true,
      data: result.list,
      count: result.total,
      pagination: {
        page: parseInt((req.query.page as string) || "1", 10),
        limit: parseInt((req.query.limit as string) || "10", 10),
        totalRecords: result.total,
        totalPages: Math.ceil(
          result.total / parseInt((req.query.limit as string) || "10", 10),
        ),
      },
    });
  } catch (error) {
    console.error("Error listing error codes:", error);

    return res.status(500).json({
      status: false,
      message: "Failed to retrieve error code list",
      error: (error as Error).message,
    });
  }
};

export const adminExcelErrorCodeUpload = async (
  req: Request<unknown, unknown, unknown, unknown>,
  res: Response,
) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    const result = await adminExcelErrorCodeUploadService(file.buffer);

    if (!result.status) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: unknown) {
    const err = error as Error;

    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};
