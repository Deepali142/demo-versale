import Joi from "joi";

// Joi validation schema for coupon data
export const couponSchema = Joi.object({
  couponObjectid: Joi.string().optional().allow("").messages({
    "string.base": "Coupon Object ID must be a string",
  }),
  couponCode: Joi.string().trim().required().messages({
    "string.empty": "Coupon code is required",
    "any.required": "Coupon code is required",
  }),
  image: Joi.string().uri().optional().allow("").messages({
    "string.uri": "Image must be a valid URI",
  }),
  name: Joi.string().trim().required().messages({
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),
  discount: Joi.number().min(1).required().messages({
    "number.base": "Discount must be a number",
    "number.min": "Discount must be at least 1%",
    "any.required": "Discount is required",
  }),
  minValue: Joi.number().min(0).required().messages({
    "number.base": "Minimum value must be a number",
    "number.min": "Minimum value must be at least 0",
    "any.required": "Minimum value is required",
  }),
  expiryDate: Joi.date().required().greater("now").messages({
    "date.base": "Expiry time must be a valid date",
    "date.greater": "Expiry time must be in the future",
    "any.required": "Expiry time is required",
  }),
  description: Joi.array().items(Joi.string().trim()).required().messages({
    "array.base": "Description must be an array of strings",
    "string.empty": "Each description item must be a non-empty string",
    "any.required": "Description is required",
  }),
  // type: Joi.string().valid('percentage', 'flat').required().messages({
  //     'string.empty': 'Type is required',
  //     'any.only': 'Type must be one of [percentage, flat]',
  //     'any.required': 'Type is required',
  // }),
});

export const couponListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be greater than or equal to 1",
  }),

  limit: Joi.number().integer().min(1).max(100).default(10).messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  search: Joi.string().trim().allow("", null).messages({
    "string.base": "Search must be a string",
  }),

  status: Joi.string()
    .valid("active", "expired", "upcoming")
    .optional()
    .messages({
      "any.only": "Status must be one of: active, expired, upcoming",
    }),

  sortBy: Joi.string()
    .valid("createdAt", "updatedAt", "discount", "expiryDate")
    .optional(),

  sortOrder: Joi.string().valid("asc", "desc").optional().default("desc"),

  userId: Joi.string().trim().optional().messages({
    "string.base": "User ID must be a string",
  }),
});

export const applyCouponSchema = Joi.object({
  couponCode: Joi.string().trim().required().messages({
    "any.required": "Coupon code is required",
    "string.empty": "Coupon code cannot be empty",
  }),

  userId: Joi.string().trim().required().messages({
    "any.required": "User ID is required",
    "string.empty": "User ID cannot be empty",
  }),

  bookingId: Joi.string().trim().required().messages({
    "any.required": "Booking ID is required",
    "string.empty": "Booking ID cannot be empty",
  }),

  amount: Joi.number().min(0).required().messages({
    "any.required": "Amount is required",
    "number.base": "Amount must be a number",
  }),

  isApply: Joi.number().valid(1, 2).required().messages({
    "any.only": "isApply must be 1 (apply) or 2 (remove)",
    "any.required": "isApply is required",
  }),
});
