import Joi from "joi";

export const adminCreateEditBrandSchema = Joi.object({
  brandId: Joi.string().optional().messages({
    "string.base": "brandId must be a string",
  }),

  name: Joi.string().trim().required().messages({
    "any.required": "Brand name must be provided",
    "string.empty": "Brand name must not be empty",
  }),
});

export const brandListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
  }),

  search: Joi.string().allow("").optional().messages({
    "string.base": "Search must be a string",
  }),

  sortby: Joi.string()
    .valid("createdAt", "name", "updatedAt")
    .optional()
    .messages({
      "string.base": "SortBy must be a string",
      "any.only": "SortBy must be one of: createdAt, name, updatedAt",
    }),

  orderby: Joi.string().valid("asc", "desc").optional().messages({
    "string.base": "OrderBy must be a string",
    "any.only": "OrderBy must be either asc or desc",
  }),
});

export const userBrandListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
  }),

  search: Joi.string().allow("").optional().messages({
    "string.base": "Search must be a string",
  }),
});
