import mongoose, { Schema, Document } from "mongoose";

export interface ILead extends Document {
  leadId?: string;
  place?: string;
  quantity?: number;
  comment?: string;
  user_id: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const leadSchema = new Schema<ILead>(
  {
    leadId: { type: String, trim: true, default: "" },
    place: { type: String, trim: true, default: "" },
    quantity: { type: Number, default: 0 },
    comment: { type: String, trim: true, default: "" },

    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

export const Lead = mongoose.model<ILead>("Lead", leadSchema);

export default Lead;
