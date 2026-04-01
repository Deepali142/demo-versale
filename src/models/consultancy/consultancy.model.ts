import { Schema, model, Document, Types } from "mongoose";

export interface IConsultancy extends Document {
  user_id: Types.ObjectId;
  enquiryId: Types.ObjectId;
  brandId: Types.ObjectId;

  quantity: string;
  comment: string;
  place: string;
  consultancyId: string;

  serviceName: Record<string, unknown>[]; 
  addressDetails: Record<string, unknown>; 

  slot: "FIRST_HALF" | "SECOND_HALF";
  date: Date;

  status: "BOOKED" | "COMPLETE" | "CANCELLED" | "CLOSED";

  documentURL: string;
  alternatePhone: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const consultancySchema = new Schema<IConsultancy>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    enquiryId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    brandId: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    quantity: { type: String, default: "" },
    comment: { type: String, default: "" },
    place: { type: String, default: "" },
    consultancyId: { type: String, default: "" },

    //  FIXED (no any, no TS error)
    serviceName: {
      type: [Schema.Types.Mixed] as unknown as Record<string, unknown>[],
      default: [],
    },

    //  FIXED (no any)
    addressDetails: {
      type: Schema.Types.Mixed as unknown as Record<string, unknown>,
      default: {},
    },

    slot: {
      type: String,
      enum: ["FIRST_HALF", "SECOND_HALF"],
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["BOOKED", "COMPLETE", "CANCELLED", "CLOSED"],
      default: "BOOKED",
      required: true,
    },

    documentURL: { type: String, default: "" },
    alternatePhone: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Consultancy = model<IConsultancy>(
  "Consultancy",
  consultancySchema
);