import mongoose, { Schema, Document } from "mongoose";

export interface ITool extends Document {
  name: string;
  description: string;
  image?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const toolSchema = new Schema<ITool>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

toolSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  },
);

export const Tool = mongoose.model<ITool>("Tool", toolSchema);
