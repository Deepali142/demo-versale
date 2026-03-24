import Joi from "joi";

export const addToolSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Tool name is required",
  }),

  description: Joi.string().trim().required().messages({
    "string.empty": "Tool description is required",
  }),

  image: Joi.string().uri().optional().allow(""),
});

export const updateToolSchema = Joi.object({
  // toolId: Joi.string().required(), // not needed as of now
  name: Joi.string().trim().optional(),
  description: Joi.string().trim().optional(),
  image: Joi.string().optional(),
});

export const getToolListSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().allow("").optional(),
});

export const removeToolIdParamsSchema = Joi.object({
  toolId: Joi.string().length(24).hex().required(),
});

export const addToolBagSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": '"Tools bag name" should be a type of text',
    "string.empty": '"Tools bag name" cannot be an empty field',
    "any.required": '"Tools bag name" is a required field',
  }),

  description: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": '"description" should be a type of text',
  }),

  tools: Joi.array()
    .items(
      Joi.object({
        toolId: Joi.string().required().messages({
          "string.base": '"toolId" should be a type of text',
          "string.empty": '"toolId" cannot be an empty field',
          "any.required": '"toolId" is a required field',
        }),

        name: Joi.string().required().messages({
          "string.base": '"Tool name" should be a type of text',
          "string.empty": '"Tool name" cannot be an empty field',
          "any.required": '"Tool name" is a required field',
        }),

        quantity: Joi.number().required().messages({
          "number.base": '"quantity" should be a type of number',
          "any.required": '"quantity" is a required field',
        }),

        description: Joi.string().optional().allow(null, "").messages({
          "string.base": '"description" should be a type of text',
        }),
      }),
    )
    .required()
    .messages({
      "array.base": '"tools" should be an array of objects',
      "any.required": '"tools" is a required field',
    }),

  image: Joi.string().optional().default("").messages({
    "string.base": '"image" should be a type of text',
  }),
});

export const updateToolBagSchema = Joi.object({
  name: Joi.string().trim().optional().messages({
    "string.base": '"name" should be a type of text',
  }),

  description: Joi.string().trim().optional().allow(null, "").messages({
    "string.base": '"description" should be a type of text',
  }),

  tools: Joi.array()
    .items(
      Joi.object({
        toolId: Joi.string().required().messages({
          "string.base": '"toolId" should be a type of text',
          "string.empty": '"toolId" cannot be an empty field',
          "any.required": '"toolId" is a required field',
        }),

        name: Joi.string().required().messages({
          "string.base": '"Tool name" should be a type of text',
          "string.empty": '"Tool name" cannot be an empty field',
          "any.required": '"Tool name" is a required field',
        }),

        quantity: Joi.number().required().messages({
          "number.base": '"quantity" should be a type of number',
          "any.required": '"quantity" is a required field',
        }),

        description: Joi.string().optional().allow(null, "").messages({
          "string.base": '"description" should be a type of text',
        }),
      }),
    )
    .optional()
    .messages({
      "array.base": '"tools" should be an array of objects',
    }),

  image: Joi.string().optional().messages({
    "string.base": '"image" should be a type of text',
  }),
});

export const getToolBagListSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).optional(),
  search: Joi.string().trim().optional(),
});

export const modifyToolInToolsBagSchema = Joi.object({
  toolId: Joi.string().required().messages({
    "string.base": '"toolId" must be a string',
    "string.empty": '"toolId" cannot be empty',
    "any.required": '"toolId" is required',
  }),

  action: Joi.string().valid("add", "remove").required().messages({
    "any.only": '"action" must be either "add" or "remove"',
    "any.required": '"action" is required',
  }),

  name: Joi.when("action", {
    is: "add",
    then: Joi.string().required().messages({
      "string.base": '"name" must be a string',
      "string.empty": '"name" cannot be empty when adding a tool',
      "any.required": '"name" is required when action = add',
    }),
    otherwise: Joi.forbidden(),
  }),

  quantity: Joi.when("action", {
    is: "add",
    then: Joi.number().min(1).required().messages({
      "number.base": '"quantity" must be a number',
      "number.min": '"quantity" must be at least 1',
      "any.required": '"quantity" is required when action = add',
    }),
    otherwise: Joi.forbidden(),
  }),

  description: Joi.string().allow("", null).messages({
    "string.base": '"description" must be a string',
  }),
});

export const toolRequestValidatorSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "any.required": "Name is required",
  }),

  identifier: Joi.string().trim().required().messages({
    "string.base": "Identifier must be a valid Tool/ToolBag ID string",
    "string.empty": "Identifier cannot be empty",
    "any.required": "Identifier is required",
  }),

  technicianId: Joi.string().trim().required().messages({
    "string.base": "Technician ID must be a string",
    "string.empty": "Technician ID cannot be empty",
    "any.required": "Technician ID is required",
  }),

  quantity: Joi.number().integer().min(1).required().messages({
    "number.base": "Quantity must be a number",
    "number.min": "Quantity must be at least 1",
    "any.required": "Quantity is required",
  }),

  status: Joi.string()
    .valid("REQUESTED", "ASSIGNED", "APPROVED", "DENIED")
    .default("REQUESTED")
    .messages({
      "any.only": "Status must be one of REQUESTED, ASSIGNED, APPROVED, DENIED",
    }),

  type: Joi.string()
    .valid("TOOL", "TOOL_BAG")
    .default("TOOL")
    .required()
    .messages({
      "string.base": "Type must be a string",
      "any.only": "Type must be either TOOL or TOOL_BAG",
      "any.required": "Type is required",
    }),

  reason: Joi.string()
    .valid("BROKEN", "LOST", "OTHER", "NEW_ASSIGNMENT")
    .default("OTHER")
    .required()
    .messages({
      "string.base": "Reason must be a string",
      "any.only": "Reason must be one of BROKEN, LOST, OTHER, NEW_ASSIGNMENT",
      "any.required": "Reason is required",
    }),

  description: Joi.string().allow("").default("").messages({
    "string.base": "Description must be a string",
  }),

  comment: Joi.string().allow("").default("").messages({
    "string.base": "Comment must be a string",
  }),
});

export const getToolRequestListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().trim().allow("").default(""),
  sortby: Joi.string()
    .valid("createdAt", "name", "identifier", "quantity", "status")
    .default("createdAt"),
});

export const updateToolRequestStatusParamsSchema = Joi.object({
  requestId: Joi.string().length(24).required(),
});

export const updateToolRequestStatusBodySchema = Joi.object({
  status: Joi.string()
    .valid("REQUESTED", "APPROVED", "DENIED", "ASSIGNED")
    .required(),
  comment: Joi.string().optional(),
});
