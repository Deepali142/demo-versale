import { Request, Response, NextFunction } from "express";
import { ObjectSchema } from "joi";

// optionally kept for future use
// export const validateRequest = (schema: ObjectSchema) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     const { error } = schema.validate(req.body, { abortEarly: false });

//     if (error) {
//       return res.status(400).json({
//         success: false,
//         message: "Validation failed",
//         errors: error.details.map((err) => err.message),
//       });
//     }

//     next();
//   };
// };

export const validateRequest = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Validate all fields and return all errors, not just the first
      allowUnknown: false, // Reject fields that are NOT defined in the schema (unknown keys)
      stripUnknown: true, // Automatically remove unknown fields from req.body
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((err) => err.message), // Send all error messages to client
      });
    }

    req.body = value; // Save cleaned + validated data back into req.body
    next();
  };
};
