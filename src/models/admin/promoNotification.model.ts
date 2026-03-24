import mongoose, { Schema, Document } from "mongoose";

export interface IPromotionalNotification extends Document {
  title: string;
  body?: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

const promotionalSchema = new Schema<IPromotionalNotification>(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "Promotion",
    },
  },
  { timestamps: true },
);

export const PromotionalNotification = mongoose.model<IPromotionalNotification>(
  "PromotionalNotification",
  promotionalSchema,
);
