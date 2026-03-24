import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  text: string;
  isChecked: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
    },
    isChecked: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema,
);
