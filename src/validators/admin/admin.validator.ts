import Joi from "joi";

export const adminUpdateSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  role: Joi.string().valid("admin", "super_admin").optional(),
  status: Joi.string().valid("pending", "active", "blocked").optional(),
  countryCode: Joi.string()
    .pattern(/^\+[0-9]{1,4}$/)
    .optional(),
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional(),
}).min(1); // At least one field must be provided

// Consultancy
export const adminCreateConsultancySchema = Joi.object({
  user_id: Joi.string().required().messages({
    "any.required": "user_id is required",
  }),
  brandId: Joi.string().optional(),
  addressId: Joi.string().required().messages({
    "any.required": "addressId is required",
  }),
  slot: Joi.string().valid("FIRST_HALF", "SECOND_HALF").required().messages({
    "any.required": "slot is required",
    "any.only": "slot must be FIRST_HALF or SECOND_HALF",
  }),
  date: Joi.date().required().messages({
    "any.required": "date is required",
    "date.base": "Invalid date format",
  }),
  consultancyId: Joi.string().optional(),
  alternatePhone: Joi.string().optional(),
  documentURL: Joi.string().optional(),
  serviceName: Joi.array().optional(),
  quantity: Joi.string().optional(),
  comment: Joi.string().optional(),
  place: Joi.string().optional(),
});

export const adminConsultancyListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
    "number.integer": "Page must be an integer",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
    "number.integer": "Limit must be an integer",
  }),

  search: Joi.string().allow("").default("").messages({
    "string.base": "Search must be a string",
  }),

  sortby: Joi.string()
    .valid(
      "createdAt",
      "date",
      "consultancyId",
      "place",
      "quantity",
      "slot",
      "status",
      "userDetails.name",
    )
    .default("createdAt")
    .messages({
      "any.only": "Invalid sort field",
      "string.base": "Sortby must be a string",
    }),

  orderby: Joi.string().valid("asc", "desc").default("desc").messages({
    "any.only": "orderby must be either 'asc' or 'desc'",
    "string.base": "orderby must be a string",
  }),
});
