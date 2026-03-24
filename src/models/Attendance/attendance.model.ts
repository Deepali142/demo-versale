import mongoose, { Document, Schema } from "mongoose";

export interface IAttendance extends Document {
  technicianId: string;
  date: Date;
  type: "PRESENT" | "ABSENT" | "LEAVE" | "HOLIDAY";
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    technicianId: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ["PRESENT", "ABSENT", "LEAVE", "HOLIDAY"],
      required: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

// Unique attendance per technician per day
attendanceSchema.index({ technicianId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>(
  "Attendance",
  attendanceSchema,
);
