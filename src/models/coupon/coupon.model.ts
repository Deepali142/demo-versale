import { Schema, model, Document } from "mongoose";

export interface ICoupon extends Document {
  couponCode: string;
  image?: string;
  name: string;
  discount: number;
  minValue: number;
  expiryDate: Date;
  description: string[];
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const couponSchema = new Schema<ICoupon>(
  {
    couponCode: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
    minValue: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    description: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const Coupon = model<ICoupon>("Coupon", couponSchema);

export default Coupon;
