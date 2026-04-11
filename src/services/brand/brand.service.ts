import { PipelineStage, Types } from "mongoose";
import { Brand } from "../../models/brand/brand.model";
import { AdminCreateEditBrandPayload, BrandListParams, UserBrandListParams } from "../../types/brand.types";

export const adminCreateEditBrandService = async (
  payload: AdminCreateEditBrandPayload,
) => {
  const { brandId, name } = payload;

  const normalizedName = name
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, " "); 

  if (!normalizedName) {
    throw new Error("BRAND_NAME_REQUIRED");
  }

  if (normalizedName.length < 2) {
    throw new Error("BRAND_NAME_TOO_SHORT");
  }

  if (normalizedName.length > 50) {
    throw new Error("BRAND_NAME_TOO_LONG");
  }

  const existingBrand = await Brand.findOne({ name: normalizedName });

  if (brandId) {
    if (!Types.ObjectId.isValid(brandId)) {
      throw new Error("INVALID_BRAND_ID");
    }

    if (existingBrand && String(existingBrand._id) !== brandId) {
      throw new Error("BRAND_NAME_EXISTS");
    }

    await Brand.updateOne(
      { _id: brandId },
      { $set: { name: normalizedName } }
    );

    return { message: "Brand updated successfully" };
  }

  if (existingBrand) {
    throw new Error("BRAND_ALREADY_EXISTS");
  }

  await Brand.create({ name: normalizedName });

  return { message: "Brand created successfully" };
};

export const toggleBrandStatusService = async (brandId: string) => {
  if (!Types.ObjectId.isValid(brandId)) {
    throw new Error("INVALID_BRAND_ID");
  }

  const brand = await Brand.findById(brandId);

  if (!brand) {
    throw new Error("BRAND_NOT_FOUND");
  }

  const newStatus = !brand.isActive;

  await Brand.updateOne(
    { _id: brandId },
    { $set: { isActive: newStatus } }
  );

  return {
    message: newStatus ? "Brand activated" : "Brand inactivated",
  };
};

export const getBrandListService = async ({
  page,
  limit,
  search = "",
  sortField,
  sortOrder,
}: BrandListParams) => {
  const skip = (page - 1) * limit;

  const matchStage: PipelineStage.Match = {
    $match: {
      ...(search && {
        name: { $regex: search, $options: "i" },
      }),
    },
  };

  const pipeline: PipelineStage[] = [
    matchStage,

    {
      $project: {
        _id: 1,
        name: { $ifNull: ["$name", ""] },
        isActive: 1,
        createdAt: 1,
        updatedAt: 1,
        globalErrorCodes: 1,
        registeredDate: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        errorCodeCount: {
          $size: { $ifNull: ["$globalErrorCodes", []] },
        },
      },
    },

    { $sort: { [sortField]: sortOrder } },
    { $skip: skip },
    { $limit: limit },
  ];

  const [list, totalCountArr] = await Promise.all([
    Brand.aggregate(pipeline),
    Brand.aggregate([
      matchStage,
      { $count: "totalCount" },
    ]),
  ]);

  return {
    list,
    totalCount: totalCountArr[0]?.totalCount || 0,
  };
};

export const getUserBrandListService = async ({
  page = 1,
  limit = 10,
  search = "",
}: UserBrandListParams) => {
  const skip = (page - 1) * limit;

  const matchStage: PipelineStage.Match = {
    $match: {
      isActive: true,
      ...(search && {
        name: { $regex: search, $options: "i" },
      }),
    },
  };

  const pipeline: PipelineStage[] = [
    matchStage,

    {
      $project: {
        _id: 1,
        name: { $ifNull: ["$name", ""] },
        createdAt: 1,
      },
    },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ];

  const [data, totalArr] = await Promise.all([
    Brand.aggregate(pipeline),
    Brand.aggregate([
      matchStage,
      { $count: "totalCount" },
    ]),
  ]);

  return {
    data,
    total: totalArr[0]?.totalCount || 0,
  };
};