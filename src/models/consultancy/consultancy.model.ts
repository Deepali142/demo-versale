import { Schema, model, Document, Types } from "mongoose";

export interface IConsultancy extends Document {
  user_id: Types.ObjectId;
  brandId: Types.ObjectId;
  quantity: string;
  comment: string;
  place: string;
  consultancyId: string;
  serviceName: Record<string, null>[]; // Array of objects
  addressDetails: Record<string, null>; // Generic object
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
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true },

    quantity: { type: String, default: "" },
    comment: { type: String, default: "" },
    place: { type: String, default: "" },
    consultancyId: { type: String, default: "" },

    serviceName: {
      type: [{ type: Schema.Types.Mixed }],
      default: [],
    },

    addressDetails: {
      type: Schema.Types.Mixed,
      default: {},
    },

    slot: {
      type: String,
      enum: ["FIRST_HALF", "SECOND_HALF"],
      required: true,
    },

    date: { type: Date, required: true },

    status: {
      type: String,
      enum: ["BOOKED", "COMPLETE", "CANCELLED", "CLOSED"],
      default: "BOOKED",
      required: true,
    },

    documentURL: { type: String, default: "" },
    alternatePhone: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Consultancy = model<IConsultancy>(
  "Consultancy",
  consultancySchema,
);
