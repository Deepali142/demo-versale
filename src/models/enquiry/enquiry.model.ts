import { Schema, model, Document, Types } from "mongoose";

export interface IServiceItem {
  acType: string;
  quantity: number;
}

export interface IServiceDetail {
  service_id: Types.ObjectId;
  items: IServiceItem[];
}

export interface IAddressDetails {
  house?: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  saveAs?: string;
  landmark?: string;
}

export interface ISchedule {
  slot?: "FIRST_HALF" | "SECOND_HALF";
  date?: Date;
}

export interface IAddOn {
  name?: string;
  description?: string;
  quantity?: number;
  unit?: string;
}

export interface IEnquiry extends Document {
  user_id: Types.ObjectId;
  enquiryId?: string;

  details?: {
    serviceDetails?: IServiceDetail[];
    propertyType?: "RESIDENTIAL" | "COMMERCIAL";
    condensorLocation?: "WALL_MOUNTED_LOW" | "WALL_MOUNTED_HIGH" | "FLOOR_MOUNTED";
  };

  type: "BOOKING" | "QUOTE_REQUEST";

  subType?:
    | "INSTALLATION"
    | "REPAIR"
    | "SERVICE"
    | "COMPRESSOR"
    | "GAS_CHARGING"
    | "COPPER_PIPING"
    | "AMC"
    | "OLD_AC"
    | "OTHER"
    | "PURCHASE_LEAD"
    | "FREE_CONSULTATION";

  bookingId?: Types.ObjectId;

  addressDetails: IAddressDetails;

  schedule?: ISchedule;

  status:
    | "REQUESTED"
    | "SCHEDULED"
    | "IN_PROGRESS"
    | "HOLD"
    | "PAYMENT_PENDING"
    | "COMPLETED"
    | "CANCELLED"
    | "RESCHEDULED"
    | "QUOTE_SHARED"
    | "QUOTE_REJECTED"
    | "QUOTE_ACCEPTED"
    | "BOOKING_CREATED"
    | "INSPECTION_SCHEDULED"
    | "INSPECTION_COMPLETED"
    | "FOLLOW_UP_REQUIRED";

  addOns?: IAddOn[];

  assignedTo?: Types.ObjectId;

  noOfAc?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

const enquirySchema = new Schema<IEnquiry>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    enquiryId: { type: String },

    details: {
      serviceDetails: [
        {
          service_id: {
            type: Schema.Types.ObjectId,
            ref: "Service",
            required: true,
          },
          items: [
            {
              acType: { type: String, default: "" },
              quantity: { type: Number, default: 0 },
            },
          ],
        },
      ],

      propertyType: {
        type: String,
        enum: ["RESIDENTIAL", "COMMERCIAL"],
      },

      condensorLocation: {
        type: String,
        enum: ["WALL_MOUNTED_LOW", "WALL_MOUNTED_HIGH", "FLOOR_MOUNTED"],
      },
    },

    type: {
      type: String,
      enum: ["BOOKING", "QUOTE_REQUEST"],
      required: true,
    },

    subType: {
      type: String,
      enum: [
        "INSTALLATION",
        "REPAIR",
        "SERVICE",
        "COMPRESSOR",
        "GAS_CHARGING",
        "COPPER_PIPING",
        "AMC",
        "OLD_AC",
        "OTHER",
        "PURCHASE_LEAD",
        "FREE_CONSULTATION",
      ],
    },

    bookingId: {
      type: Schema.Types.ObjectId,
      ref: "Booking",
    },

    addressDetails: {
      house: { type: String },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipcode: { type: String, required: true },
      saveAs: { type: String, trim: true, default: "" },
      landmark: { type: String, trim: true, default: "" },
    },

    schedule: {
      slot: {
        type: String,
        enum: ["FIRST_HALF", "SECOND_HALF"],
      },
      date: {
        type: Date,
      },
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "SCHEDULED",
        "IN_PROGRESS",
        "HOLD",
        "PAYMENT_PENDING",
        "COMPLETED",
        "CANCELLED",
        "RESCHEDULED",
        "QUOTE_SHARED",
        "QUOTE_REJECTED",
        "QUOTE_ACCEPTED",
        "BOOKING_CREATED",
        "INSPECTION_SCHEDULED",
        "INSPECTION_COMPLETED",
        "FOLLOW_UP_REQUIRED",
      ],
      default: "REQUESTED",
      required: true,
    },

    addOns: [
      {
        name: { type: String },
        description: { type: String },
        quantity: { type: Number, default: 1 },
        unit: { type: String },
      },
    ],

    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "Technician",
    },

    noOfAc: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Enquiry = model<IEnquiry>("Enquiry", enquirySchema);

export default Enquiry;