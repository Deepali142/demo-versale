import Joi from "joi";

export const createEditErrorCodeSchema = Joi.object({
  brandId: Joi.string().required().messages({
    "string.base": "brandId must be a string",
    "any.required": "brandId is required",
  }),

  errorCodeId: Joi.string().optional(),

  code: Joi.string().allow("").default(""),

  acType: Joi.string().required().messages({
    "string.base": "acType must be a string",
    "any.required": "acType is required",
  }),

  models: Joi.string().required().messages({
    "string.base": "models must be a string",
    "any.required": "models is required",
  }),

  solution: Joi.array().items(Joi.string().trim()).default([]),

  description: Joi.string().allow("").default(""),

  category: Joi.string()
    .valid("INVERTOR", "NON_INVERTOR")
    .default("NON_INVERTOR"),
});

export const errorCodeListSchema = Joi.object({
  brandId: Joi.string().required(),
  errorCode: Joi.string().required(),
  acType: Joi.string().valid("INVERTOR", "NON_INVERTOR").required(),
});

export const adminErrorCodeListSchema = Joi.object({
  brandId: Joi.string().required(),

  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),

  search: Joi.string().allow("").optional(),

  category: Joi.string().valid("INVERTOR", "NON_INVERTOR").optional(),

  sortby: Joi.string().optional(),
  orderby: Joi.string().valid("asc", "desc").optional(),
});

export const adminExcelErrorCodeUploadSchema = Joi.object({
  // If you want to pass additional fields with the Excel file,
  // declare them here. For now only "file" is required.
}).unknown(true); // allow multipart form-data fields
