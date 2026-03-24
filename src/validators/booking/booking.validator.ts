import Joi from "joi";

export const createBookingSchema = Joi.object({
  user_id: Joi.string().trim().required().messages({
    "any.required": "User ID is required",
    "string.empty": "User ID cannot be empty",
  }),

  name: Joi.string().trim().required().messages({
    "any.required": "Name is required",
    "string.empty": "Name cannot be empty",
  }),

  addressId: Joi.string().trim().required().messages({
    "any.required": "Address ID is required",
    "string.empty": "Address ID cannot be empty",
  }),

  serviceDetails: Joi.array()
    .items(
      Joi.object({
        service_id: Joi.string().trim().required().messages({
          "any.required": "Service ID is required",
          "string.empty": "Service ID cannot be empty",
        }),
        serviceType: Joi.string().optional().allow("").messages({
          "string.base": "Service Type must be a string",
        }),
        quantity: Joi.string().pattern(/^\d+$/).required().messages({
          "any.required": "Quantity is required",
          "string.pattern.base": "Quantity must be a numeric string",
        }),
        acType: Joi.string().optional().allow(""),
        place: Joi.string().optional().allow(""),
        otherService: Joi.string().optional().allow(""),
        comment: Joi.string().optional().allow(""),
        services: Joi.array().items(Joi.string()).optional(),
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Service details must be an array",
      "array.min": "At least one service must be provided",
      "any.required": "Service details are required",
    }),

  slot: Joi.string().valid("FIRST_HALF", "SECOND_HALF").required().messages({
    "any.only": "Slot must be either FIRST_HALF or SECOND_HALF",
    "any.required": "Slot is required",
  }),

  date: Joi.date().iso().required().messages({
    "date.base": "Date must be a valid date",
    "any.required": "Date is required",
  }),

  amount: Joi.number().positive().required().messages({
    "number.base": "Amount must be a number",
    "number.positive": "Amount must be greater than zero",
    "any.required": "Amount is required",
  }),

  order_id: Joi.string().optional().allow("").messages({
    "string.base": "Order ID must be a string",
  }),
});

export const editBookingValidator = Joi.object({
  serviceDetails: Joi.array()
    .items(
      Joi.object({
        service_id: Joi.string().required(),

        service_data: Joi.object({
          _id: Joi.string().required(),
          name: Joi.string().required(),
          icon: Joi.string().uri().optional(),
          category: Joi.string().optional(),
          key: Joi.string().optional(),
        }).optional(),

        services: Joi.array().items(Joi.string()).optional().default([]),

        serviceType: Joi.string().allow("").optional(),
        quantity: Joi.alternatives()
          .try(Joi.string(), Joi.number().integer().min(1))
          .required(),
        acType: Joi.string().allow("").optional(),
        place: Joi.string().allow("").optional(),
        comment: Joi.string().allow("").optional(),
        otherService: Joi.string().allow("").optional(),
      }),
    )
    .optional(),

  addressId: Joi.string().required(),

  slot: Joi.string().valid("FIRST_HALF", "SECOND_HALF").required(),

  date: Joi.date().iso().required(),

  amount: Joi.number().min(0).required(),
});

export const bookingListValidator = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  status: Joi.alternatives()
    .try(
      Joi.array().items(Joi.string()),
      Joi.string().custom((value) => value.split(",")),
    )
    .optional()
    .messages({
      "string.base": "Status must be a string or an array of strings",
    }),

  search: Joi.string().allow("").optional(),
  sortby: Joi.string()
    .valid("createdAt", "date", "amount")
    .optional()
    .messages({ "any.only": "Invalid sort field" }),

  orderby: Joi.string()
    .valid("asc", "desc")
    .optional()
    .messages({ "any.only": "orderby must be 'asc' or 'desc'" }),

  startDate: Joi.date().iso().optional().messages({
    "date.format": "startDate must be in ISO date format",
  }),

  endDate: Joi.date().iso().optional().messages({
    "date.format": "endDate must be in ISO date format",
  }),
});

export const addOrderItemValidator = Joi.object({
  bookingId: Joi.string().trim().required().messages({
    "any.required": "Booking ID is required",
    "string.empty": "Booking ID cannot be empty",
  }),

  orderItems: Joi.array()
    .items(
      Joi.object({
        item: Joi.string().trim().required().messages({
          "any.required": "Item name is required",
          "string.empty": "Item name cannot be empty",
        }),
        quantity: Joi.number().integer().min(1).required().messages({
          "any.required": "Quantity is required",
          "number.base": "Quantity must be a number",
          "number.min": "Quantity must be at least 1",
        }),
        price: Joi.number().min(0).required().messages({
          "any.required": "Price is required",
          "number.base": "Price must be a valid number",
          "number.min": "Price cannot be negative",
        }),
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.base": "Order items must be an array",
      "array.min": "At least one order item is required",
      "any.required": "Order items are required",
    }),
});

export const userBookingListSchema = {
  params: Joi.object({
    userId: Joi.string().required().messages({
      "string.empty": "User ID is required",
      "any.required": "User ID is required",
    }),
  }),

  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number",
      "number.min": "Page must be at least 1",
    }),

    limit: Joi.number().integer().min(1).default(10).messages({
      "number.base": "Limit must be a number",
      "number.min": "Limit must be at least 1",
    }),

    search: Joi.string().allow("").default(""),

    sortby: Joi.string()
      .valid("createdAt", "date", "status", "updatedAt", "amount")
      .default("createdAt"),

    orderby: Joi.string().valid("asc", "desc").default("desc"),
  }),
};
