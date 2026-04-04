import { Schema, model, Types } from "mongoose";
import { ICart } from "../../types/cart.types";
import { HydratedDocument } from "mongoose";
type CartDocument = HydratedDocument<ICart>;

/**
 * Cart Item Schema
 */
const cartItemSchema = new Schema(
  {
    serviceId: {
      type: Types.ObjectId,
      ref: "Service",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    serviceType: {
      type: String,
      enum: ["Sterilization", "Repair", "Installation"],
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
      min: 1,
    },

    unitPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    totalPrice: {
      type: Number,
      default: 0,
    },

    attributes: {
      type: {
        type: String,
        required: true,
      },
      subType: String,
      variant: String,
    },
  },
  { _id: true }
);

/**
 * Category Group Schema
 */
const cartServiceSchema = new Schema(
  {
    category: {
      type: String,
      enum: ["AC", "Boiler", "Heat Pump"],
      required: true,
    },

    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { _id: false }
);

/**
 * Cart Schema
 */
const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    services: {
      type: [cartServiceSchema],
      default: [],
    },

    itemTotal: {
      type: Number,
      default: 0,
    },

    discount: {
      type: Number,
      default: 0,
    },

    tax: {
      vatRate: {
        type: Number,
        default: 18,
      },
      vatAmount: {
        type: Number,
        default: 0,
      },
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/**
 * 🔥 PRE-SAVE HOOK (FIXED)
 */

cartSchema.pre("save", function (next) {
  const cart = this as CartDocument; 

  let itemTotal = 0;

  for (const service of cart.services) {
    for (const item of service.items) {
      const total = item.quantity * item.unitPrice;
      item.totalPrice = total;
      itemTotal += total;
    }
  }

  const discount = cart.discount || 0;

  const vatRate = cart.tax?.vatRate ?? 18;
  const taxable = itemTotal - discount;
  const vatAmount = (taxable * vatRate) / 100;

  cart.itemTotal = itemTotal;

  cart.tax = {
    vatRate,
    vatAmount,
  };

  cart.grandTotal = taxable + vatAmount;

  next();
});
/**
 * Export Model
 */
export const Cart = model<ICart>("Cart", cartSchema);