import Joi from "joi";

export const createBookingSchema = Joi.object({
  user_id: Joi.string().required(),

  addressId: Joi.string().required(),

  slot: Joi.string()
    .valid("FIRST_HALF", "SECOND_HALF")
    .required(),

  date: Joi.date().iso().required(),

  /**
   * NEW STRUCTURE (IMPORTANT)
   */
  services: Joi.array()
    .items(
      Joi.object({
        category: Joi.string()
          .valid("AC", "HEAT_PUMP", "BOILER")
          .required(),

        items: Joi.array()
          .items(
            Joi.object({
              serviceId: Joi.string().required(),

              name: Joi.string().required(),

              quantity: Joi.number().integer().min(1).required(),

              unitPrice: Joi.number().min(0).required(),

              totalPrice: Joi.number().min(0).required(),

              acType: Joi.string().allow("").optional(),
            }),
          )
          .min(1)
          .required(),
      }),
    )
    .min(1)
    .required(),

  /**
   * PRICING (NEW)
   */
  itemTotal: Joi.number().min(0).required(),

  discount: Joi.number().min(0).default(0),

  tax: Joi.object({
    cgst: Joi.number().min(0).required(),
    sgst: Joi.number().min(0).required(),

    cgstAmount: Joi.number().min(0).required(),
    sgstAmount: Joi.number().min(0).required(),

    totalTax: Joi.number().min(0).required(),
  }).required(),

  grandTotal: Joi.number().min(0).required(),

  /**
   * COUPON
   */
  coupon: Joi.object({
    code: Joi.string().required(),
    discountAmount: Joi.number().min(0).required(),
  }).optional(),

  order_id: Joi.string().allow("").optional(),
});