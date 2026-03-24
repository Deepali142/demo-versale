import Joi from "joi";

export const attendanceValidationSchema = Joi.object({
  technicianId: Joi.string().required().messages({
    "string.base": "technicianId must be a string.",
    "any.required": "technicianId is required.",
  }),

  date: Joi.date().required().messages({
    "date.base": "date must be a valid date.",
    "any.required": "date is required.",
  }),

  type: Joi.string()
    .valid("PRESENT", "ABSENT", "LEAVE", "HOLIDAY")
    .required()
    .messages({
      "string.base": "type must be a string.",
      "any.only":
        'type must be one of ["PRESENT", "ABSENT", "LEAVE", "HOLIDAY"].',
      "any.required": "type is required.",
    }),

  description: Joi.string()
    .allow("")
    .default("") // <-- recommended
    .messages({
      "string.base": "description must be a string.",
    }),
});
