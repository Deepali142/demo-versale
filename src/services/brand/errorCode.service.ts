import { Brand } from "../../models/brand/brand.model";
import { Types } from "mongoose";
import ExcelJS from "exceljs";

interface IUpdateOrCreateErrorCodeInput {
  brandId: string;
  errorCodeId?: string;
  code: string;
  acType: string;
  models: string;
  solution: string[];
  category: "INVERTOR" | "NON_INVERTOR";
  description: string;
}

export interface IErrorCodeListRequest {
  brandId: string;
  errorCode: string;
  acType: "INVERTOR" | "NON_INVERTOR";
}
export interface AdminErrorCodeListParams {
  brandId: string;
}

export interface AdminErrorCodeListQuery {
  page: unknown;
  limit: unknown;
  search: unknown;
  category: unknown;
  sortby: unknown;
  orderby: unknown;
}
interface ParsedExcelRow {
  brandname: string;
  modelname: string;
  actype: string;
  ["error code"]: string;
  description?: string;
  solution?: string;
  category?: string;
}

type ParsedExcel = Record<string, string | number | boolean | null | undefined>;

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

  const errorCode = {
    code: code || "",
    acType,
    models,
    solution: solution || [],
    description: description || "",
    category: category || "NON_INVERTOR",
  };

  if (errorCodeId) {
    // Update existing global error code
    const result = await Brand.updateOne(
      {
        _id: brandId,
        "globalErrorCodes._id": errorCodeId,
      },
      {
        $set: {
          "globalErrorCodes.$.code": errorCode.code,
          "globalErrorCodes.$.solution": errorCode.solution,
          "globalErrorCodes.$.acType": errorCode.acType,
          "globalErrorCodes.$.models": errorCode.models,
          "globalErrorCodes.$.category": errorCode.category,
          "globalErrorCodes.$.description": errorCode.description,
        },
      },
    );

    if (result.modifiedCount === 0) {
      return {
        success: false,
        message: "Error code not found to update",
      };
    }

    return {
      success: true,
      message: "Error code updated successfully",
    };
  }

  // Create new global error code
  await Brand.updateOne(
    { _id: brandId },
    { $push: { globalErrorCodes: errorCode } },
  );

  return {
    success: true,
    message: "Error code saved successfully",
  };
};

export const errorCodeListService = async (
  payload: IErrorCodeListRequest,
): Promise<unknown> => {
  const { brandId, errorCode, acType } = payload;

  const brand = await Brand.findOne(
    {
      _id: new Types.ObjectId(brandId),
      "globalErrorCodes.code": errorCode,
      "globalErrorCodes.acType": acType,
    },
    {
      globalErrorCodes: { $elemMatch: { code: errorCode } },
    },
  );

  if (!brand) {
    return null;
  }

  return brand.globalErrorCodes[0];
};

export const adminErrorCodeListService = async (
  params: AdminErrorCodeListParams,
  query: AdminErrorCodeListQuery,
) => {
  const brandId = params.brandId;

  const page = parseInt((query.page as string) || "1", 10);
  const limit = parseInt((query.limit as string) || "10", 10);
  const search = (query.search as string)?.trim() || "";
  const category = (query.category as string)?.trim() || "";
  const sortField = (query.sortby as string) || "createdAt";
  const sortOrder = query.orderby && query.orderby === "desc" ? -1 : 1;

  const matchConditions: Record<string, unknown> = {
    $and: [{ _id: new Types.ObjectId(brandId) }],
  };

  if (search) {
    (matchConditions.$and as unknown[]).push({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { "globalErrorCodes.code": { $regex: search, $options: "i" } },
        { "globalErrorCodes.models": { $regex: search, $options: "i" } },
        { "globalErrorCodes.acType": { $regex: search, $options: "i" } },
      ],
    });
  }

  if (category) {
    (matchConditions.$and as unknown[]).push({
      "globalErrorCodes.category": category,
    });
  }

  const errorCodeList = await Brand.aggregate([
    { $unwind: "$globalErrorCodes" },
    { $match: matchConditions },
    {
      $project: {
        _id: "$globalErrorCodes._id",
        code: "$globalErrorCodes.code",
        acType: "$globalErrorCodes.acType",
        models: "$globalErrorCodes.models",
        createdAt: "$globalErrorCodes.createdAt",
        solution: "$globalErrorCodes.solution",
        category: "$globalErrorCodes.category",
        description: "$globalErrorCodes.description",
      },
    },
    { $sort: { [sortField]: sortOrder } },
    { $skip: (page - 1) * limit },
    { $limit: limit },
  ]);

  const totalRecords = await Brand.aggregate([
    { $match: { _id: new Types.ObjectId(brandId) } },
    { $unwind: "$globalErrorCodes" },
    { $match: matchConditions },
    { $count: "count" },
  ]);

  return {
    list: errorCodeList,
    total: totalRecords.length ? totalRecords[0].count : 0,
  };
};

export const adminExcelErrorCodeUploadService = async (fileBuffer: Buffer) => {
  if (!fileBuffer) {
    return {
      status: false,
      message: "No file provided",
    };
  }

  const workbook = new ExcelJS.Workbook();

  try {
    // Load buffer directly — no Uint8Array conversion!
    // await workbook.xlsx.load(fileBuffer);
  } catch {
    return {
      status: false,
      message: "Invalid or corrupted Excel file",
    };
  }

  const sheet = workbook.worksheets[0];

  if (!sheet) {
    return {
      status: false,
      message: "No sheets found in the workbook",
    };
  }

  // ---------- Extract Headers ----------
  const headerRow = sheet.getRow(1);
  const headers = (headerRow.values as (string | number | undefined)[])
    .slice(1)
    .map((h) => h?.toString().trim().toLowerCase());

  const expectedColumns = [
    "brandname",
    "modelname",
    "actype",
    "error code",
    "description",
    "solution",
    "category",
  ];

  // Validate headers
  const missingColumns = expectedColumns.filter(
    (col) => !headers.includes(col.toLowerCase()),
  );

  if (missingColumns.length > 0) {
    return {
      status: false,
      message: "Invalid column names",
      missingColumns,
    };
  }

  // ---------- Parse rows ----------
  const rows: ParsedExcelRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const values = row.values as (string | number | null | undefined)[];

    const rowData: ParsedExcel = {};

    values.slice(1).forEach((cellValue, index) => {
      const key = headers[index];

      if (key) {
        rowData[key] = cellValue?.toString().trim();
      }
    });

    // rows.push(rowData as ParsedExcel);
    rows.push({
      brandname: rowData["brandname"]?.toString() ?? "",
      modelname: rowData["modelname"]?.toString() ?? "",
      actype: rowData["actype"]?.toString() ?? "",
      ["error code"]: rowData["error code"]?.toString() ?? "",
      description: rowData["description"]?.toString() ?? "",
      solution: rowData["solution"]?.toString() ?? "",
      category: rowData["category"]?.toString() ?? "",
    });
  });

  if (!rows.length) {
    return {
      status: false,
      message: "Uploaded file is empty",
    };
  }

  // ---------- Process each row ----------
  for (const row of rows) {
    const {
      brandname,
      modelname,
      actype,
      ["error code"]: errorCode,
      description,
      solution,
      category,
    } = row;

    const errorCodeObj = {
      code: errorCode || "",
      models: modelname || "",
      acType: actype || "",
      solution: solution ? solution.split(",").map((i) => i.trim()) : [],
      description: description || "",
      category: category || "NON_INVERTOR",
    };

    const brand = await Brand.findOne({ name: brandname });

    if (!brand) {
      await Brand.create({
        name: brandname,
        globalErrorCodes: [errorCodeObj],
      });
      continue;
    }

    // Check duplicate
    const matched = await Brand.aggregate([
      {
        $match: {
          name: brandname,
          globalErrorCodes: {
            $elemMatch: {
              code: errorCode,
              models: modelname,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          matchedErrorCode: {
            $filter: {
              input: "$globalErrorCodes",
              as: "err",
              cond: {
                $and: [
                  { $eq: ["$$err.code", errorCode] },
                  { $eq: ["$$err.models", modelname] },
                ],
              },
            },
          },
        },
      },
    ]);

    if (matched.length > 0) {
      const existing = matched[0].matchedErrorCode[0];

      await Brand.updateOne(
        {
          name: brandname,
          globalErrorCodes: {
            $elemMatch: {
              code: errorCode,
              models: modelname,
            },
          },
        },
        {
          $set: {
            "globalErrorCodes.$.code": errorCodeObj.code || existing.code,
            "globalErrorCodes.$.models": errorCodeObj.models || existing.models,
            "globalErrorCodes.$.acType": errorCodeObj.acType || existing.acType,
            "globalErrorCodes.$.solution":
              errorCodeObj.solution.length > 0
                ? errorCodeObj.solution
                : existing.solution,
            "globalErrorCodes.$.description":
              errorCodeObj.description || existing.description,
            "globalErrorCodes.$.category":
              errorCodeObj.category || existing.category,
          },
        },
      );
    } else {
      await Brand.updateOne(
        { name: brandname },
        { $push: { globalErrorCodes: errorCodeObj } },
      );
    }
  }

  return {
    status: true,
    message: "File processed successfully",
  };
};
