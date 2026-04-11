import { Request, Response } from "express";
import {
  adminCreateEditBrandService,
  getBrandListService,
  getUserBrandListService,
  toggleBrandStatusService,
} from "../../services/brand/brand.service";
import { AdminCreateEditBrandPayload } from "../../types/brand.types";

import {
  ok,
  badRequest,
  serverError,
  notFound,
} from "../../middlewares/response/response";

export const adminCreateEditBrand = async (req: Request, res: Response) => {
  try {
    const payload = req.body as AdminCreateEditBrandPayload;

    const result = await adminCreateEditBrandService(payload);

    return ok(res, result.message);
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : "";

    switch (err) {
      case "BRAND_NAME_REQUIRED":
        return badRequest(res, "Brand name must be provided");

      case "INVALID_BRAND_ID":
        return badRequest(res, "Invalid brand ID");

      case "BRAND_NAME_EXISTS":
      case "BRAND_ALREADY_EXISTS":
        return badRequest(res, "Brand already exists");

      default:
        return serverError(res);
    }
  }
};

export const adminBrandActiveInactive = async (
  req: Request,
  res: Response
) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return badRequest(res, "Brand ID is required");
    }

    const result = await toggleBrandStatusService(brandId);

    return ok(res, result.message);
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : "";

    if (err === "INVALID_BRAND_ID") {
      return badRequest(res, "Invalid brand ID");
    }

    if (err === "BRAND_NOT_FOUND") {
      return notFound(res, "No data found");
    }

    return serverError(res);
  }
};

export const adminBrandList = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = String(req.query.search || "");
    const sortField = String(req.query.sortby || "createdAt");
    const sortOrder = req.query.orderby === "asc" ? 1 : -1;

    const { list, totalCount } = await getBrandListService({
      page,
      limit,
      search,
      sortField,
      sortOrder,
    });

    return ok(res, "Success", list, totalCount);
  } catch {
    return serverError(res);
  }
};

export const userBrandList = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = String(req.query.search || "");

    const result = await getUserBrandListService({
      page,
      limit,
      search,
    });

    return ok(res, "Success", result.data, result.total);
  } catch {
    return serverError(res);
  }
};