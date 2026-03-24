import mongoose, { Schema, Document } from "mongoose";
import { IAddress } from "../user/address.model";

export interface IServiceDetail {
  service_id: mongoose.Types.ObjectId;
  serviceType?: string;
  quantity: string;
  acType?: string;
  place?: string;
  otherService?: string;
  comment?: string;
  services?: string[];
}

export interface IOrderItem {
  item: string;
  quantity: string;
  price: mongoose.Types.Decimal128;
}

export interface IBooking extends Document {
  user_id: mongoose.Types.ObjectId;
  bookingId: string;
  invoiceId?: string;
  serviceDetails: IServiceDetail[] | unknown[];
  addressDetails: IAddress[];
  couponDetails?: object;
  slot: "FIRST_HALF" | "SECOND_HALF";
  date: Date;
  status:
    | "BOOKED"
    | "ASSIGNMENT_PENDING"
    | "TECHNICIAN_ASSIGNED"
    | "PAYMENT_PENDING"
    | "PAID"
    | "IN_PROGRESS"
    | "COMPLETE"
    | "CANCELLED";
  amount: mongoose.Types.Decimal128;
  order_id?: string;
  assigned_to?: mongoose.Types.ObjectId;
  orderItems?: IOrderItem[];
  originalTotal?: string;
  isCouponApply?: string;
  discountAmount?: string;
  discountedTotal?: string;
  discount?: string;
  invoiceUrl?: string;
}

const bookingSchema = new Schema<IBooking>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookingId: { type: String },
    invoiceId: { type: String },
    serviceDetails: [
      {
        service_id: {
          type: Schema.Types.ObjectId,
          ref: "Service",
          required: true,
        },
        serviceType: String,
        quantity: String,
        acType: { type: String, default: "" },
        place: { type: String, default: "" },
        otherService: { type: String, default: "" },
        comment: { type: String, default: "" },
        services: [],
      },
    ],
    addressDetails: [{}],
    couponDetails: {},
    slot: { type: String, enum: ["FIRST_HALF", "SECOND_HALF"], required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        "BOOKED",
        "ASSIGNMENT_PENDING",
        "TECHNICIAN_ASSIGNED",
        "PAYMENT_PENDING",
        "PAID",
        "IN_PROGRESS",
        "COMPLETE",
        "CANCELLED",
      ],
      default: "BOOKED",
      required: true,
    },
    amount: { type: Schema.Types.Decimal128, required: true },
    order_id: { type: String, default: "" },
    assigned_to: { type: Schema.Types.ObjectId, ref: "Technician" },
    orderItems: [
      {
        item: String,
        quantity: String,
        price: Schema.Types.Decimal128,
      },
    ],
    originalTotal: { type: String, default: "" },
    isCouponApply: { type: String, default: "2" },
    discountAmount: { type: String, default: "" },
    discountedTotal: { type: String, default: "" },
    discount: { type: String, default: "" },
    invoiceUrl: { type: String },
  },
  { timestamps: true },
);

export const Booking = mongoose.model<IBooking>("Booking", bookingSchema);
