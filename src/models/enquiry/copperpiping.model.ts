import { Schema, model, Document, Types } from "mongoose";

/**
 * AC Type Subdocument Interface
 */
export interface IAcType {
  type:
    | "SPLIT_AC"
    | "WINDOW_AC"
    | "CASSETTE_AC"
    | "VRV_VRF_AC"
    | "DUCTED_AC"
    | "TOWER_AC";
  quantity: number;
}

/**
 * Main Document Interface
 */
export interface ICopperPipingEnquiry extends Document {
  enquiryId: Types.ObjectId;
  propertyType: "RESIDENTIAL" | "COMMERCIAL";
  acTypes: IAcType[];
  outdoorUnitLocation: "WALL_LOW" | "WALL_HIGH" | "FLOOR";
  pipeLength: number;
  additionalNotes?: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AC Type Schema
 */
const acTypeSchema = new Schema<IAcType>(
  {
    type: {
      type: String,
      enum: [
        "SPLIT_AC",
        "WINDOW_AC",
        "CASSETTE_AC",
        "VRV_VRF_AC",
        "DUCTED_AC",
        "TOWER_AC",
      ],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

/**
 * Main Schema
 */
const copperPipingSchema = new Schema<ICopperPipingEnquiry>(
  {
    enquiryId: {
      type: Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
    },

    propertyType: {
      type: String,
      enum: ["RESIDENTIAL", "COMMERCIAL"],
      required: true,
    },

    acTypes: {
      type: [acTypeSchema],
      required: true,
    },

    outdoorUnitLocation: {
      type: String,
      enum: ["WALL_LOW", "WALL_HIGH", "FLOOR"],
      required: true,
    },

    pipeLength: {
      type: Number,
      required: true,
    },

    additionalNotes: {
      type: String,
    },

    images: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true, versionKey: false }
);

/**
 * Model
 */
export const CopperPipingEnquiry = model<ICopperPipingEnquiry>(
  "CopperPipingEnquiry",
  copperPipingSchema
);