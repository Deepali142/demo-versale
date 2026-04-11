import { Request, Response } from "express";
import {
  adminErrorCodeListService,
  adminExcelErrorCodeUploadService,
  createOrUpdateErrorCodeService,
  errorCodeListService,
} from "../../services/brand/errorCode.service";

import {
  ok,
  badRequest,
  notFound,
  serverError,
} from "../../middlewares/response/response";

/* =========================
   COMMON RESPONSE TYPE
========================= */

export interface ServiceResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  error?: string;
}

/* =========================
   BODY TYPE
========================= */

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

/* =========================
   CREATE / UPDATE
========================= */

export const adminCreateEditErrorCode = async (
  req: Request,
  res: Response
) => {
  try {
    const body = req.body as ICreateEditErrorCodeBody;

    if (!body?.brandId) {
      return badRequest(res, "brandId required");
    }

    // ✅ FIX: Tell TS what service returns
    const response: ServiceResponse = await createOrUpdateErrorCodeService({
      brandId: body.brandId,
      ...(body.errorCodeId && { errorCodeId: body.errorCodeId }),
      acType: body.acType,
      models: body.models,
      code: body.code,
      solution: body.solution,
      description: body.description,
      category: body.category,
    });

    if (!response.success) {
      return badRequest(res, response.message);
    }

    return ok(res, response.message, response.data);
  } catch (err) {
    console.error(err);
    return serverError(res);
  }
};

/* =========================
   USER LIST
========================= */

export const errorCodeList = async (req: Request, res: Response) => {
  try {
    const data = await errorCodeListService(req.body);

    if (!data) {
      return notFound(res, "Brand or error code not found");
    }

    return ok(res, "Success", data);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
};

/* =========================
   ADMIN LIST
========================= */

export const adminErrorCodeList = async (
  req: Request,
  res: Response
) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return badRequest(res, "Brand ID is required");
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const query = {
      page,
      limit,
      search: (req.query.search as string)?.trim() || "",
      category: (req.query.category as string)?.trim() || "",
      sortby: (req.query.sortby as string) || "",
      orderby: (req.query.orderby as string) || "asc",
    };

    const result = await adminErrorCodeListService({ brandId }, query);

    return ok(
      res,
      "Success",
      {
        data: result.data,
        pagination: {
          page,
          limit,
          totalRecords: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
      },
      result.total
    );
  } catch (error) {
    console.error(error);
    return serverError(res, "Failed to retrieve error code list");
  }
};

/* =========================
   EXCEL UPLOAD
========================= */

export const adminExcelErrorCodeUpload = async (
  req: Request,
  res: Response
) => {
  try {
    const file = req.file;

    if (!file?.buffer) {
      return badRequest(res, "No file uploaded");
    }

    // ✅ FIX: Type response
    const result: ServiceResponse = await adminExcelErrorCodeUploadService(
      file.buffer
    );

    if (!result.success) {
      return badRequest(res, result.message);
    }

    return ok(res, result.message, null, result.count);
  } catch (error) {
    console.error(error);
    return serverError(res);
  }
};