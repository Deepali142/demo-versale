import { Schema, model, Types, HydratedDocument } from "mongoose";
import { ICart, ICartItem, ICartService } from "../../types/cart.types";

type CartDocument = HydratedDocument<ICart>;

/**
 * Cart Item Schema
 */
const cartItemSchema = new Schema<ICartItem>(
  {
    type: { type: String, enum: ["BOOKING", "QUOTE_REQUEST"], required: true },
    subType: {
      type: String,
      enum: [
        "INSTALLATION", "REPAIR", "SERVICE", "COMPRESSOR", "GAS_CHARGING",
        "COPPER_PIPING", "AMC", "OLD_AC", "OTHER", "PURCHASE_LEAD", "FREE_CONSULTATION",
      ],
    },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service" },
    name: { type: String, trim: true },
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, default: 0, min: 0 },
    totalPrice: { type: Number, default: 0, min: 0 },
    attributes: {
      categoryType: { type: String, required: true },
      subType: { type: String, default: "" },
      variant: { type: String, default: "" },
    },
    meta: {
      brand: String,
      model: String,
      age: String,
      condition: String,
      issue: String,
      planType: String,
      notes: String,
    },
  },
  { _id: true }
);

/**
 * Category Schema for BOOKING items
 */
const cartCategorySchema = new Schema<ICartService>(
  {
    category: { type: String, enum: ["AC", "Boiler", "Heat Pump"], required: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { _id: false }
);

/**
 * Main Cart Schema
 */
const cartSchema = new Schema<ICart>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // BOOKING ITEMS
    services: { type: [cartCategorySchema], default: [] },

    // QUOTE_REQUEST ITEMS
    quoteRequests: { type: [cartItemSchema], default: [] },

    itemTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tax: {
      vatRate: { type: Number, default: 18 },
      vatAmount: { type: Number, default: 0 },
    },
    grandTotal: { type: Number, default: 0 },

    addressId: { type: Schema.Types.ObjectId, ref: "Address" },
    slot: { type: String, enum: ["FIRST_HALF", "SECOND_HALF", "FULL_DAY"] },
    date: { type: Date },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * Price Calculation Pre-save Hook
 */
cartSchema.pre<CartDocument>("save", function (next) {
  let itemTotal = 0;

  // Sum BOOKING items
  for (const category of this.services || []) {
    for (const item of category.items || []) {
      item.totalPrice = item.quantity * item.unitPrice;
      itemTotal += item.totalPrice;
    }
  }

  this.itemTotal = itemTotal;

  const discount = this.discount ?? 0;
  const taxable = Math.max(itemTotal - discount, 0);
  const vatRate = this.tax?.vatRate ?? 18;
  const vatAmount = (taxable * vatRate) / 100;

  this.tax.vatAmount = vatAmount;
  this.grandTotal = taxable + vatAmount;

  next();
});

cartSchema.index({ userId: 1, isActive: 1 });

export const Cart = model<ICart>("Cart", cartSchema);