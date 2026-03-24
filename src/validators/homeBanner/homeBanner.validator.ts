import Joi, { ObjectSchema } from "joi";

export interface BannerValidationSchema {
  imageUrl: string;
  position: number;
  destination: "COUPON" | "AD";
  data: string;
  id?: string;
}

export const bannerValidatorSchema: ObjectSchema<BannerValidationSchema> =
  Joi.object({
    imageUrl: Joi.string().required().messages({
      "string.base": "imageUrl must be a string.",
      "string.empty": "imageUrl cannot be empty.",
      "any.required": "imageUrl is required.",
    }),

    position: Joi.number().integer().required().messages({
      "number.base": "Position must be a number.",
      "number.integer": "Position must be an integer.",
      "any.required": "Position is required.",
    }),

    destination: Joi.string().valid("COUPON", "AD").required().messages({
      "string.base": "Destination must be a string.",
      "any.only": "Destination must be one of [COUPON, AD].",
      "any.required": "Destination is required.",
    }),

    data: Joi.string().required().messages({
      "string.base": "data must be a string.",
      "string.empty": "data cannot be empty.",
      "any.required": "data is required.",
    }),

    id: Joi.string().optional(),
  });

export const sortingQuerySchema = Joi.object({
  sortby: Joi.string()
    .valid("position", "createdAt", "updatedAt")
    .default("position")
    .messages({
      "any.only": "sortby must be one of: position, createdAt, updatedAt",
      "string.base": "sortby must be a string",
    }),

  orderby: Joi.string().valid("asc", "desc").default("asc").messages({
    "any.only": "orderby must be either 'asc' or 'desc'",
    "string.base": "orderby must be a string",
  }),
});
