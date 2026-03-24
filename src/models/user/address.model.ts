import mongoose, { Document, Schema } from "mongoose";

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  house?: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  saveAs?: string;
  landmark?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    house: { type: String },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipcode: { type: String, required: true },
    saveAs: { type: String, trim: true, default: "" },
    landmark: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const Address = mongoose.model<IAddress>("Address", addressSchema);
export default Address;
