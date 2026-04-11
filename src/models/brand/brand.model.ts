import { Schema, model } from "mongoose";
import { IBrand, IErrorCode, ErrorCategory } from "../../types/brand.types";

// ---------------------
// SUB-SCHEMA
// ---------------------

const errorCodeSchema = new Schema<IErrorCode>(
  {
    code: { type: String, trim: true, required: true },

    acType: { type: String, trim: true },

    models: { type: String, trim: true },

    solution: [{ type: String, trim: true }],

    category: {
      type: String,
      enum: Object.values(ErrorCategory),
      default: ErrorCategory.NON_INVERTER,
    },

    description: { type: String, trim: true },
  },
  { _id: false } 
);

const brandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String, 
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    globalErrorCodes: [errorCodeSchema],
  },
  { timestamps: true }
);

brandSchema.index({ name: 1 });
brandSchema.index({ isActive: 1 });

export const Brand = model<IBrand>("Brand", brandSchema);