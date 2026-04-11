import { Brand } from "../../models/brand/brand.model";
import { Types } from "mongoose";
import ExcelJS from "exceljs";
import {
  AdminErrorCodeListParams,
  AdminErrorCodeListQuery,
  IErrorCodeListRequest,
  IUpdateOrCreateErrorCodeInput,
  ParsedExcelRow,
} from "../../types/error.types";
const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

/* =========================
   CREATE / UPDATE
========================= */
const normalizeBuffer = (data: Buffer | Uint8Array): Buffer => {
  return data instanceof Buffer ? data : Buffer.from(data);
};

export const createOrUpdateErrorCodeService = async (
  payload: IUpdateOrCreateErrorCodeInput,
) => {
  const {
    brandId,
    errorCodeId,
    code,
    acType,
    models,
    solution,
    description,
    category,
  } = payload;

  if (!Types.ObjectId.isValid(brandId)) {
    return { success: false, message: "INVALID_BRAND_ID" };
  }

  const errorCodeData = {
    code: code || "",
    acType,
    models,
    solution: solution || [],
    description: description || "",
    category: category || "NON_INVERTOR",
  };

  if (errorCodeId) {
    const result = await Brand.updateOne(
      { _id: brandId, "globalErrorCodes._id": errorCodeId },
      {
        $set: {
          "globalErrorCodes.$": errorCodeData,
        },
      },
    );

    if (!result.modifiedCount) {
      return { success: false, message: "ERROR_CODE_NOT_FOUND" };
    }

    return { success: true, message: "Error code updated successfully" };
  }

  await Brand.updateOne(
    { _id: brandId },
    { $push: { globalErrorCodes: errorCodeData } },
  );

  return { success: true, message: "Error code saved successfully" };
};

/* =========================
   USER ERROR CODE SEARCH
========================= */

export const errorCodeListService = async (payload: IErrorCodeListRequest) => {
  const { brandId, errorCode, acType } = payload;

  const brand = await Brand.findOne(
    {
      _id: brandId,
      "globalErrorCodes.code": errorCode,
      "globalErrorCodes.acType": acType,
    },
    {
      globalErrorCodes: { $elemMatch: { code: errorCode, acType } },
    },
  ).lean();

  if (!brand) {
    return { success: false, message: "NOT_FOUND", data: null };
  }

  return {
    success: true,
    message: "Success",
    data: brand.globalErrorCodes?.[0] || null,
  };
};

/* =========================
   ADMIN LIST
========================= */

export const adminErrorCodeListService = async (
  params: AdminErrorCodeListParams,
  query: AdminErrorCodeListQuery,
) => {
  const brandId = params.brandId;

  if (!Types.ObjectId.isValid(brandId)) {
    return { success: false, message: "INVALID_BRAND_ID" };
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const search = getString(query.search);
  const category = getString(query.category);
  const sortField: string = (query.sortby as string) || "createdAt";
  const sortOrder = query.orderby === "desc" ? -1 : 1;

  const pipeline: any[] = [
    { $match: { _id: new Types.ObjectId(brandId) } },
    { $unwind: "$globalErrorCodes" },
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { "globalErrorCodes.code": { $regex: search, $options: "i" } },
          { "globalErrorCodes.models": { $regex: search, $options: "i" } },
          { "globalErrorCodes.acType": { $regex: search, $options: "i" } },
        ],
      },
    });
  }

  if (category) {
    pipeline.push({
      $match: { "globalErrorCodes.category": category },
    });
  }

  const list = await Brand.aggregate([
    ...pipeline,
    {
      $project: {
        _id: "$globalErrorCodes._id",
        code: "$globalErrorCodes.code",
        acType: "$globalErrorCodes.acType",
        models: "$globalErrorCodes.models",
        solution: "$globalErrorCodes.solution",
        category: "$globalErrorCodes.category",
        description: "$globalErrorCodes.description",
        createdAt: "$globalErrorCodes.createdAt",
      },
    },
    { $sort: { [sortField]: sortOrder } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  const totalAgg = await Brand.aggregate([...pipeline, { $count: "count" }]);

  return {
    success: true,
    message: "Success",
    data: list,
    total: totalAgg[0]?.count || 0,
  };
};

/* =========================
   EXCEL UPLOAD
========================= */

export const adminExcelErrorCodeUploadService = async (
  fileBuffer: Buffer | Uint8Array,
) => {
  if (!fileBuffer) {
    return { success: false, message: "FILE_REQUIRED" };
  }

  const workbook = new ExcelJS.Workbook();

  try {
    const normalizedBuffer = normalizeBuffer(fileBuffer);

    await workbook.xlsx.load(normalizedBuffer as any);
  } catch {
    return { success: false, message: "INVALID_FILE" };
  }

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { success: false, message: "INVALID_SHEET" };
  }

  /* =========================
     HEADER VALIDATION
  ========================= */

  const headerRow = sheet.getRow(1);

  if (!headerRow || !headerRow.values) {
    return { success: false, message: "INVALID_HEADER" };
  }

  const headers = (headerRow.values as any[])
    .slice(1)
    .map((h) => h?.toString().trim().toLowerCase());

  const expected = [
    "brandname",
    "modelname",
    "actype",
    "error code",
    "description",
    "solution",
    "category",
  ];

  const missing = expected.filter((col) => !headers.includes(col));

  if (missing.length) {
    return {
      success: false,
      message: "INVALID_COLUMNS",
      data: missing,
    };
  }

  /* =========================
     PARSE ROWS
  ========================= */

  const rows: ParsedExcelRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const values = row.values as any[];
    if (!values || values.length === 0) return;

    const obj: ParsedExcelRow = {
      brandname: "",
      modelname: "",
      actype: "",
      "error code": "",
      description: "",
      solution: "",
      category: "",
    };

    values.slice(1).forEach((val, i) => {
      const key = headers[i] as keyof ParsedExcelRow;

      if (key && key in obj) {
        obj[key] = val?.toString().trim() || "";
      }
    });

    const hasValue = Object.values(obj).some((v) => v !== "");

    if (hasValue) {
      rows.push(obj);
    }
  });
  if (!rows.length) {
    return { success: false, message: "EMPTY_FILE" };
  }

  /* =========================
     PROCESS DATA
  ========================= */

  try {
    for (const r of rows) {
      const {
        brandname,
        modelname,
        actype,
        ["error code"]: errorCode,
        description,
        solution,
        category,
      } = r;

      // ✅ Skip invalid rows
      if (!brandname || !errorCode) continue;

      const errorObj = {
        code: errorCode,
        models: modelname || "",
        acType: actype || "",
        solution: solution
          ? solution
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        description: description || "",
        category: category || "NON_INVERTOR",
      };

      await Brand.updateOne(
        { name: brandname },
        {
          $setOnInsert: { name: brandname },
          $push: { globalErrorCodes: errorObj },
        },
        { upsert: true },
      );
    }
  } catch (err) {
    return {
      success: false,
      message: "PROCESSING_FAILED",
      error: err instanceof Error ? err.message : "UNKNOWN_ERROR",
    };
  }

  return {
    success: true,
    message: "File processed successfully",
    count: rows.length,
  };
};
