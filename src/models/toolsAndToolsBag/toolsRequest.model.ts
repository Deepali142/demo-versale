import { Schema, model, Document } from "mongoose";

export interface IToolRequest extends Document {
  name: string;
  identifier: string;
  technicianId: string;
  quantity: number;
  status: "REQUESTED" | "APPROVED" | "ASSIGNED" | "DENIED";
  type: "TOOL" | "TOOL_BAG";
  reason: "BROKEN" | "LOST" | "OTHER" | "NEW_ASSIGNMENT";
  description?: string;
  comment?: string;
}

const toolRequestSchema = new Schema<IToolRequest>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    identifier: {
      type: String,
      required: true,
      trim: true,
    },
    technicianId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ["REQUESTED", "APPROVED", "ASSIGNED", "DENIED"],
      default: "REQUESTED",
      required: true,
    },
    type: {
      type: String,
      enum: ["TOOL", "TOOL_BAG"],
      default: "TOOL",
      required: true,
    },
    reason: {
      type: String,
      enum: ["BROKEN", "LOST", "OTHER", "NEW_ASSIGNMENT"],
      default: "OTHER",
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

export const ToolRequest = model<IToolRequest>(
  "ToolRequest",
  toolRequestSchema,
);
