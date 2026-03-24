import Joi from "joi";
import { ServiceCategory } from "../../models/service/service.model";

export const addServiceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    "string.base": "Name must be a string.",
    "string.empty": "Name is required.",
    "any.required": "Service name is required.",
  }),

  icon: Joi.string().uri().optional().messages({
    "string.uri": "Icon must be a valid URL.",
  }),

  description: Joi.array()
    .items(Joi.string().trim().min(3))
    .optional()
    .messages({
      "array.base": "Description must be an array of strings.",
    }),

  terms: Joi.array().items(Joi.string().trim().min(3)).optional().messages({
    "array.base": "Terms must be an array of strings.",
  }),

  banner_images: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().trim().required().messages({
          "string.base": "Banner type must be a string.",
          "any.required": "Banner type is required.",
        }),
        url: Joi.string().uri().required().messages({
          "string.uri": "Banner URL must be a valid URL.",
          "any.required": "Banner URL is required.",
        }),
      }),
    )
    .optional()
    .messages({
      "array.base": "Banner images must be an array of objects.",
    }),

  category: Joi.string()
    .valid(...Object.values(ServiceCategory))
    .required()
    .messages({
      "any.only": `Category must be one of: ${Object.values(ServiceCategory).join(", ")}.`,
      "any.required": "Category is required.",
    }),

  key: Joi.string().trim().optional().messages({
    "string.base": "Key must be a string.",
  }),
});

//  Validation schema for service list query params

export const serviceListValidator = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number.",
    "number.integer": "Page must be an integer.",
    "number.min": "Page number must be at least 1.",
  }),
  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Limit must be a number.",
    "number.integer": "Limit must be an integer.",
    "number.min": "Limit must be at least 1.",
    "number.max": "Limit cannot exceed 100.",
  }),
  search: Joi.string().trim().allow("").optional(),
  sortby: Joi.string()
    .valid("name", "createdAt", "orderBy", "updatedAt")
    .optional()
    .messages({
      "any.only":
        "Sort field must be one of name, createdAt, orderBy, or updatedAt.",
    }),
  orderby: Joi.string().valid("asc", "desc").optional().messages({
    "any.only": "Order by must be either 'asc' or 'desc'.",
  }),
});
