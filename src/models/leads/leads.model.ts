import { Schema, model, Document, Types } from "mongoose";

export interface IAcDetail {
  acType: string;
  quantity: number;
}

export interface ILead extends Document {
  leadId?: string;
  place?: string;
  quantity?: number;
  comment?: string;
  username?: string;
  phoneNumber?: string;
  user_id: Types.ObjectId;
  address?: string;
  enquiryId?: Types.ObjectId;
  acDetails: IAcDetail[];
  createdAt?: Date;
  updatedAt?: Date;
}

const leadSchema = new Schema<ILead>(
  {
    leadId: { type: String, trim: true, default: "" },
    place: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 0 },
    comment: { type: String, trim: true },
    username: { type: String, trim: true, required: false },
    phoneNumber: { type: String, trim: true, required: false },
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    enquiryId: {
      type: Schema.Types.ObjectId,
    },
    acDetails: [
      {
        acType: {
          type: String,
          trim: true,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
  },
  { timestamps: true }
);

const Lead = model<ILead>("Lead", leadSchema);

export default Lead;