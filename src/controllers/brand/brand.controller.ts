import { Request, Response } from "express";
import {
  adminCreateEditBrandService,
  getBrandListService,
  getUserBrandListService,
  toggleBrandStatusService,
} from "../../services/brand/brand.service";
import { AdminCreateEditBrandPayload } from "../../services/brand/brand.service";

export const adminCreateEditBrand = async (req: Request, res: Response) => {
  try {
    const payload = req.body as AdminCreateEditBrandPayload;

    const result = await adminCreateEditBrandService(payload);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error.message : "SERVER_ERROR";

    let message = "Something went wrong";

    switch (err) {
      case "BRAND_NAME_REQUIRED":
        message = "Brand name must be provided";
        break;
      case "INVALID_BRAND_ID":
        message = "Invalid brandId";
        break;
      case "BRAND_NAME_EXISTS":
        message = "Brand name already exists";
        break;
      case "BRAND_ALREADY_EXISTS":
        message = "Brand already exists";
        break;
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};

export const adminBrandActiveInactive = async (req: Request, res: Response) => {
  try {
    const { brandId } = req.params;

    if (!brandId) {
      return res.status(400).json({
        success: false,
        message: "Invalid brand ID",
      });
    }

    const result = await toggleBrandStatusService(brandId);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.message === "INVALID_BRAND_ID" ||
        error.message === "BRAND_NOT_FOUND"
      ) {
        return res.status(400).json({
          success: false,
          message:
            error.message === "BRAND_NOT_FOUND"
              ? "No data found"
              : "Invalid brand ID",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const adminBrandList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    const sortField = (req.query.sortby as string) || "createdAt";
    const sortOrder = req.query.orderby === "asc" ? 1 : -1;

    const { list, totalCount } = await getBrandListService({
      page,
      limit,
      search,
      sortField,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      data: list,
      count: totalCount,
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const userBrandList = async (req: Request, res: Response) => {
  const value = req.query;

  const page = parseInt((value.page as string) || "1", 10) || 1;
  const limit = parseInt((value.limit as string) || "999", 10) || 999;
  const search = (value.search as string) || "";

  try {
    const result = await getUserBrandListService({
      page,
      limit,
      search,
    });

    return res.status(200).json({
      success: true,
      data: result.data,
      count: result.total,
    });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err instanceof Error ? err.message : "Unknown error",
    });
  }
};
