import { Schema, model, Document, Types } from "mongoose";

export interface IOldAcDetail {
  brand?: string;
  model?: string;
  acType?: string;
  tonnage?: string;
  age?: string;
  condition?: string;
  technology?: string;
  photos: string[];
}


export interface IOldAcEnquiryDetail extends Document {
  enquiryId: Types.ObjectId;
  oldAcDetails: IOldAcDetail[];
  createdAt: Date;
  updatedAt: Date;
}

const oldAcDetailSchema = new Schema<IOldAcDetail>(
  {
    brand: { type: String },
    model: { type: String },
    acType: { type: String },
    tonnage: { type: String },
    age: { type: String },
    condition: { type: String },
    technology: { type: String },
    photos: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);


const oldAcSchema = new Schema<IOldAcEnquiryDetail>(
  {
    enquiryId: {
      type: Schema.Types.ObjectId,
      ref: "Enquiry",
      required: true,
    },

    oldAcDetails: {
      type: [oldAcDetailSchema],
      default: [],
    },
  },
  { timestamps: true }
);


export const OldAcEnquiryDetail = model<IOldAcEnquiryDetail>(
  "OldAcEnquiryDetail",
  oldAcSchema
);