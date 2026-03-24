import mongoose, { Schema, Document } from "mongoose";

export interface IToolItem {
  toolId: mongoose.Types.ObjectId;
  quantity: number;
  description?: string;
  name: string;
}

export interface IToolBag extends Document {
  name: string;
  tools: IToolItem[];
  description: string;
  image?: string;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const toolItemSchema = new Schema<IToolItem>({
  toolId: {
    type: Schema.Types.ObjectId,
    ref: "Tool",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
});

const toolBagSchema = new Schema<IToolBag>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tools: [toolItemSchema],
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

// Unique index for bag name (case-insensitive)
toolBagSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: { locale: "en", strength: 2 },
  },
);

export const ToolBag = mongoose.model<IToolBag>("ToolBag", toolBagSchema);
