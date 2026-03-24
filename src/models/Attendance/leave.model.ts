import { Schema, model, Document } from "mongoose";

export interface ILeave extends Document {
  technicianId: string;
  date: Date;
  halfDay: boolean;
  whichHalf: "FIRST_HALF" | "SECOND_HALF" | null;
  leaveType: "SICK_LEAVE" | "CASUAL_LEAVE" | "PAID_LEAVE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const leaveSchema = new Schema<ILeave>(
  {
    technicianId: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    halfDay: {
      type: Boolean,
      default: false,
    },

    whichHalf: {
      type: String,
      enum: ["FIRST_HALF", "SECOND_HALF"],
      default: null,
    },

    leaveType: {
      type: String,
      enum: ["SICK_LEAVE", "CASUAL_LEAVE", "PAID_LEAVE"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    reason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

// Unique leave request per technician per date
leaveSchema.index({ technicianId: 1, date: 1 }, { unique: true });

export const Leave = model<ILeave>("Leave", leaveSchema);
