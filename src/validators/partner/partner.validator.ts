import Joi from "joi";

export const addEditPartnerSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name is required.",
    "any.required": "Name is required.",
  }),

  partnerLogo: Joi.string().trim().required().messages({
    "string.base": "Partner logo must be a string.",
    "string.empty": "Partner logo is required.",
    "any.required": "Partner logo is required.",
  }),

  partnerId: Joi.string().optional().messages({
    "string.base": "Partner ID must be a string.",
  }),
});

export const partnerListQuerySchema = Joi.object({
  limit: Joi.number().integer().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
  }),
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  search: Joi.string().allow("").optional().messages({
    "string.base": "Search must be a string",
  }),
  sortOrder: Joi.string().valid("asc", "desc").optional().messages({
    "any.only": "SortOrder must be one of ['asc', 'desc']",
  }),
});
