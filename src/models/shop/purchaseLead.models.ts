import mongoose, { Schema, Document, Types, model } from "mongoose";

/* =========================================================
   ENUMS (BEST PRACTICE)
========================================================= */
export enum PurchaseLeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  FOLLOW_UP = "FOLLOW_UP",
  CONVERTED = "CONVERTED",
  LOST = "LOST",
}

export enum PurchaseLeadSource {
  APP = "APP",
  CALL = "CALL",
  WHATSAPP = "WHATSAPP",
  WEBSITE = "WEBSITE",
}

/* =========================================================
   INTERFACE
========================================================= */
export interface IPurchaseLead extends Document {
  purchaseId: string;
  userId: Types.ObjectId;
  productId: Types.ObjectId;
  enquiryId: Types.ObjectId;

  quantity: number;
  unitPrice?: number;
  soldAmount?: number;

  status: PurchaseLeadStatus;
  source: PurchaseLeadSource;

  remarks?: string;
  nextFollowUpAt?: Date;

  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   SCHEMA
========================================================= */
const purchaseLeadSchema = new Schema<IPurchaseLead>(
  {
    purchaseId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productId: {
      type: Schema.Types.ObjectId,
      ref: "product",
      required: true,
    },

    enquiryId: {
      type: Schema.Types.ObjectId,
      ref: "enquiry",
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    unitPrice: {
      type: Number,
    },

    soldAmount: {
      type: Number,
    },

    status: {
      type: String,
      enum: Object.values(PurchaseLeadStatus),
      default: PurchaseLeadStatus.NEW,
      index: true,
    },

    source: {
      type: String,
      enum: Object.values(PurchaseLeadSource),
      default: PurchaseLeadSource.APP,
    },

    remarks: {
      type: String,
      trim: true,
    },

    nextFollowUpAt: {
      type: Date,
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

purchaseLeadSchema.index({ status: 1 });
purchaseLeadSchema.index({ userId: 1 });
purchaseLeadSchema.index({ productId: 1 });
purchaseLeadSchema.index({ source: 1 });
purchaseLeadSchema.index({ unitPrice: 1 });
purchaseLeadSchema.index({ soldAmount: 1 });
purchaseLeadSchema.index({ nextFollowUpAt: 1 });
purchaseLeadSchema.index({ createdAt: -1 });


const PurchaseLead = model<IPurchaseLead>(
  "purchaseLead",
  purchaseLeadSchema,
);

export default PurchaseLead;