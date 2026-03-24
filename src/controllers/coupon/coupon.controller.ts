import { Request, Response } from "express";
import {
  applyCouponCodeService,
  couponListService,
  createCouponService,
  getCouponByIdService,
  updateCouponService,
} from "../../services/coupon/coupon.service";

export const addEditCoupon = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const {
      couponObjectid,
      couponCode,
      image,
      name,
      discount,
      minValue,
      expiryDate,
      description,
    } = req.body as {
      couponObjectid: string;
      couponCode: string;
      image?: string;
      name: string;
      discount: number;
      minValue: number;
      expiryDate: Date;
      description: string[];
    };

    // CREATE
    if (!couponObjectid || couponObjectid === "") {
      const created = await createCouponService({
        couponCode,
        ...(image !== undefined ? { image } : {}),
        name,
        discount,
        minValue,
        expiryDate,
        description,
      });

      return res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        data: created,
      });
    }

    // UPDATE
    const updated = await updateCouponService(couponObjectid, {
      couponCode,
      ...(image !== undefined ? { image } : {}),
      name,
      discount,
      minValue,
      expiryDate,
      description,
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      data: updated,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const couponList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const search = (req.query.search as string) || "";
    const sortField = (req.query.sortby as string) || "createdAt";
    const sortOrder =
      req.query.orderby === "desc" ? -1 : req.query.orderby === "asc" ? 1 : -1;

    const { data, count } = await couponListService(
      page,
      limit,
      search,
      sortField,
      sortOrder,
    );

    if (data.length === 0) {
      return res.status(200).json({
        success: false,
        message: "No data found",
        data: [],
        count: 0,
      });
    }

    return res.status(200).json({
      success: true,
      data,
      count,
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

export const getCouponById = async (req: Request, res: Response) => {
  try {
    const { couponId } = req.params as { couponId?: string };
    if (!couponId) {
      return res.status(400).json({
        status: false,
        message: "couponId is required",
      });
    }

    const coupon = await getCouponByIdService(couponId);

    if (!coupon) {
      return res.status(404).json({
        status: false,
        message: "No data found",
      });
    }

    return res.status(200).json({
      status: true,
      data: coupon,
    });
  } catch (error: unknown) {
    return res.status(400).json({
      status: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const couponActiveInactive = async (req: Request, res: Response) => {
  try {
    const { couponId } = req.params as unknown as { couponId: string };

    if (!couponId) {
      return res.status(400).json({
        status: false,
        message: "couponId is required",
      });
    }

    const result = await updateCouponService(couponId, {
      isActive: !req.body.isActive,
    });

    if (!result) {
      return res.status(404).json({
        status: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Coupon status updated successfully",
      data: result,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      status: false,
      message: error instanceof Error ? error.message : "Something went wrong",
    });
  }
};

export const applyCouponCode = async (req: Request, res: Response) => {
  try {
    const response = await applyCouponCodeService(req.body as unknown);

    if (response.status) {
      return res.status(200).json(response);
    } else {
      return res.status(400).json(response);
    }
  } catch (error) {
    console.error("Error applying coupon code:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred while applying the coupon.",
    });
  }
};
