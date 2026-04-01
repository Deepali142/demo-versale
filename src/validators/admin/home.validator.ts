import { Request, Response, NextFunction } from "express";
import Joi from "joi";

const bannerValidatorSchema = Joi.object({
  appType: Joi.string().valid("USER", "TECHNICIAN").required().messages({
    "any.only": "appType must be USER or TECHNICIAN",
    "any.required": "appType is required",
  }),

  mediaType: Joi.string().valid("IMAGE", "VIDEO").required().messages({
    "any.only": "mediaType must be IMAGE or VIDEO",
    "any.required": "mediaType is required",
  }),

  mediaUrl: Joi.string().uri().required().messages({
    "string.uri": "mediaUrl must be a valid URL",
    "any.required": "mediaUrl is required",
  }),

  thumbnailUrl: Joi.string().uri().allow("", null).messages({
    "string.uri": "thumbnailUrl must be a valid URL",
  }),

  destination: Joi.string()
    .valid("COUPON", "AD", "HOME", "PARTNER", "HOW_IT_WORK","STERILIZATION")
    .required()
    .messages({
      "any.only":
        "destination must be one of [COUPON, AD, HOME, PARTNER, HOW_IT_WORK, STERILIZATION]",
      "any.required": "destination is required",
    }),

  position: Joi.number().integer().min(1).required().messages({
    "number.base": "position must be a number",
    "number.integer": "position must be an integer",
    "number.min": "position must be greater than 0",
    "any.required": "position is required",
  }),

  section: Joi.string()
    .valid("TOP", "MIDDLE", "BOTTOM")
    .optional()
    .messages({
      "any.only": "section must be TOP, MIDDLE or BOTTOM",
    }),

  order: Joi.number().integer().min(1).optional().messages({
    "number.base": "order must be a number",
    "number.integer": "order must be an integer",
    "number.min": "order must be greater than 0",
  }),

  data: Joi.string().allow("", null).messages({
    "string.base": "data must be a string",
  }),

  id: Joi.string().optional(),
});

export interface BannerRequestBody {
  appType: "USER" | "TECHNICIAN";
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  thumbnailUrl?: string | null;
  destination: "COUPON" | "AD" | "HOME" | "PARTNER" | "HOW_IT_WORK" | "STERILIZATION";
  position: number;
  data?: string | null;
  id?: string;
  section?: "TOP" | "MIDDLE" | "BOTTOM";
  order?: number | undefined;
}

export const bannerValidator = (
  req: Request,
  res: Response,
  next: NextFunction,
): Response | void => {
  const { error } = bannerValidatorSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      status: false,
      message: error.details?.[0]?.message || "Validation error",
    });
  }

  next();
};
