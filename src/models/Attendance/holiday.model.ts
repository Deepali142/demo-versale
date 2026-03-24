import { Schema, model, Document } from "mongoose";

export interface IHoliday extends Document {
  date: Date;
  type: "PUBLIC_HOLIDAY" | "FESTIVAL" | "COMPANY_HOLIDAY";
  description?: string;
}

const holidaySchema = new Schema<IHoliday>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["PUBLIC_HOLIDAY", "FESTIVAL", "COMPANY_HOLIDAY"],
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

export const Holiday = model<IHoliday>("Holiday", holidaySchema);
