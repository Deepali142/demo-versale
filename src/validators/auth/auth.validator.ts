import Joi from "joi";

export const authSchema = Joi.object({
  phoneNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .required()
    .messages({
      "string.base": "Phone number must be 10 digits long.",
      "string.empty": "Phone number must be 10 digits long.",
      "string.pattern.base": "Phone number must be 10 digits long",
      "any.required": "Phone number is required",
    }),
  countryCode: Joi.string()
    .pattern(/^\+[0-9]{1,4}$/)
    .required()
    .messages({
      "string.base": "Country code is required",
      "string.empty": "Country code is required",
      "string.pattern.base":
        'Country code must start with a "+" followed by 1 to 4 digits',
      "any.required": "Country code is required",
    }),
}).unknown(true); // Allow additional unknown fields
