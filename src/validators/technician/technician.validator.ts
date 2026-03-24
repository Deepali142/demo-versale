import Joi from "joi";

// will be remove later
// export const updateTechnicianSchema = Joi.object({
//   name: Joi.string().optional(),
//   position: Joi.string().optional(),
//   status: Joi.string().optional(),
//   email: Joi.string().email().optional(),
//   profilePhoto: Joi.string().uri().optional(),
// }).min(1);

export const technicianSchema = Joi.object({
  name: Joi.string().optional().messages({
    "string.base": "Name must be a string",
  }),

  joiningDate: Joi.date().optional().messages({
    "date.base": "Joining date must be a valid date",
  }),

  profilePhoto: Joi.string().allow("", null).optional().messages({
    "string.base": "Profile photo must be a string",
  }),

  type: Joi.string().valid("ACD", "FC").optional().messages({
    "any.only": "Type must be either ACD or FC",
  }),

  position: Joi.string()
    .valid(
      "TBA",
      "HELPER",
      "TECHNICIAN",
      "SENIOR TECHNICIAN",
      "SUPERVISOR",
      "MANAGER",
    )
    .optional()
    .messages({
      "any.only": "Position is not valid",
    }),

  email: Joi.string().email().allow("", null).optional().messages({
    "string.email": "Email must be valid",
  }),

  secondaryContactNumber: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .allow("", null)
    .optional()
    .messages({
      "string.pattern.base": "Secondary contact number must be 10 digits",
    }),

  dob: Joi.date().allow(null).optional().messages({
    "date.base": "Date of birth must be a valid date",
  }),
});

export const technicianListValidator = Joi.object({
  search: Joi.string().allow("", null).optional(),

  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).max(100).optional().messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 100",
  }),

  active: Joi.boolean().optional(),

  status: Joi.string()
    .valid("PENDING", "APPROVED", "REJECTED")
    .optional()
    .messages({
      "any.only": "Status must be PENDING, APPROVED or REJECTED",
    }),
});

export const updateKycStatusValidator = Joi.object({
  technicianId: Joi.string().required().messages({
    "string.empty": "Technician ID is required",
  }),

  action: Joi.string()
    .valid("APPROVE", "REJECT", "REQUEST")
    .required()
    .messages({
      "any.only": "Invalid action. Allowed actions: APPROVE, REJECT, REQUEST",
      "string.empty": "Action is required",
    }),
});

export const technicianIdParamValidator = Joi.object({
  technicianId: Joi.string().length(24).required(),
});

export const technicianAssignedBookingListSchema = Joi.object({
  page: Joi.number().integer().min(1).optional().messages({
    "number.base": "Page must be a number",
    "number.integer": "Page must be an integer",
    "number.min": "Page must be at least 1",
  }),

  limit: Joi.number().integer().min(1).optional().messages({
    "number.base": "Limit must be a number",
    "number.integer": "Limit must be an integer",
    "number.min": "Limit must be at least 1",
  }),

  search: Joi.string().allow("").optional().messages({
    "string.base": "Search keyword must be a string",
  }),

  sortby: Joi.string().optional().messages({
    "string.base": "Sortby must be a string",
  }),

  orderby: Joi.string().valid("asc", "desc").optional().messages({
    "string.base": "Orderby must be a string",
    "any.only": "Orderby must be either 'asc' or 'desc'",
  }),

  startDate: Joi.date().optional().messages({
    "date.base": "Start date must be a valid date",
  }),

  endDate: Joi.date().optional().messages({
    "date.base": "End date must be a valid date",
  }),
});

export const updateProfessionalSkillsSchema = Joi.object({
  professionalSkills: Joi.array()
    .items(
      Joi.object({
        acType: Joi.string().required().messages({
          "string.base": "acType must be a string",
          "any.required": "acType is required",
        }),
        service: Joi.boolean().default(false),
        repair: Joi.boolean().default(false),
        install: Joi.boolean().default(false),
      }),
    )
    .required()
    .messages({
      "array.base": "professionalSkills must be an array",
      "any.required": "professionalSkills is required",
    }),
});

export const applyLeaveSchema = Joi.object({
  date: Joi.date().required().messages({
    "date.base": "Invalid date format",
    "any.required": "Date is required",
  }),

  reason: Joi.string().min(3).required().messages({
    "string.base": "Reason must be a string",
    "string.min": "Reason must be at least 3 characters",
    "any.required": "Reason is required",
  }),

  type: Joi.string()
    .valid("SICK_LEAVE", "CASUAL_LEAVE", "PAID_LEAVE")
    .required()
    .messages({
      "any.only":
        'Leave type must be one of ["SICK_LEAVE","CASUAL_LEAVE","PAID_LEAVE"]',
      "any.required": "Leave type is required",
    }),
});
