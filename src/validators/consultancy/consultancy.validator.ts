import Joi from "joi";
import { Types } from "mongoose";

export const createConsultancySchema = Joi.object({
  user_id: Joi.string()
    .custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "any.invalid": "Invalid user_id format",
    }),

  brandId: Joi.string()
    .custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "any.invalid": "Invalid brandId format",
    }),

  addressId: Joi.string()
    .custom((value, helpers) => {
      if (!Types.ObjectId.isValid(value)) {
        return helpers.error("any.invalid");
      }
      return value;
    })
    .required()
    .messages({
      "any.invalid": "Invalid addressId format",
    }),

  serviceName: Joi.array().items(Joi.object()).optional(),

  slot: Joi.string().valid("FIRST_HALF", "SECOND_HALF").required(),

  date: Joi.date().required().messages({
    "date.base": "Invalid date format",
  }),

  quantity: Joi.string().optional(),
  comment: Joi.string().optional(),
  place: Joi.string().optional(),
  alternatePhone: Joi.string().optional(),
});
