import { Schema, model, Document } from "mongoose";

// ---------------------
// INTERFACES
// ---------------------

export interface IErrorCode {
  code: string;
  acType: string;
  models: string;
  solution: string[];
  category: "INVERTOR" | "NON_INVERTOR";
  description: string;
}

export interface IBrand extends Document {
  name: string;
  isActive: number;
  globalErrorCodes: IErrorCode[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------
// SUB-SCHEMA (Error Codes)
// ---------------------

const errorCodeSchema = new Schema<IErrorCode>({
  code: { type: String, trim: true, default: "" },
  acType: { type: String, trim: true, default: "" },
  models: { type: String, trim: true, default: "" },
  solution: [{ type: String, trim: true }],
  category: {
    type: String,
    enum: ["INVERTOR", "NON_INVERTOR"],
    default: "NON_INVERTOR",
  },
  description: { type: String, trim: true, default: "" },
});

// ---------------------
// MAIN BRAND SCHEMA
// ---------------------

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, trim: true, default: "" },
    isActive: { type: Number, default: 1 },
    globalErrorCodes: [errorCodeSchema],
  },
  { timestamps: true },
);

// ---------------------
// MODEL EXPORT
// ---------------------

export const Brand = model<IBrand>("Brand", brandSchema);
