import Joi from "joi";

export const updateUserSchema = Joi.object({
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  isActive: Joi.number().valid(0, 1).optional(),
  type: Joi.string().valid("RETAIL", "HNI", "SME", "LARGE_SCALE").optional(),
  deviceToken: Joi.string().optional(),
}).min(1); // Ensure at least one field is passed

export const addEditAddressSchema = Joi.object({
  addressId: Joi.string().allow("").optional(),

  userId: Joi.string().required().messages({
    "any.required": "User ID is required",
    "string.base": "User ID must be a string",
  }),

  houseNumber: Joi.string().required().messages({
    "any.required": "House number is required",
    "string.base": "House number must be a string",
  }),

  street: Joi.string().required().messages({
    "any.required": "Street is required",
  }),

  state: Joi.string().required().messages({
    "any.required": "State is required",
  }),

  city: Joi.string().required().messages({
    "any.required": "City is required",
  }),

  zipCode: Joi.string().required().messages({
    "any.required": "Zip code is required",
  }),

  saveAs: Joi.string().allow("").optional(),

  landmark: Joi.string().allow("").optional(),
});

// leads

export const createLeadSchema = Joi.object({
  place: Joi.string().valid("commercial", "residential").required().messages({
    "any.required": "Place is required",
    "any.only": "Invalid place value. Allowed: commercial, residential",
  }),

  quantity: Joi.number().integer().min(1).required().messages({
    "any.required": "Quantity is required",
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be greater than 0",
  }),

  userId: Joi.string().required().length(24).messages({
    "any.required": "User ID is required",
    "string.length": "User ID must be a valid 24-character MongoDB ObjectId",
  }),

  comment: Joi.string().allow("").optional(),
});
