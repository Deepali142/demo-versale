import { Types } from "mongoose";

/**
 * 🔥 MAIN TYPE
 */
export type CartMainType = "BOOKING" | "QUOTE_REQUEST";

/**
 * 🔥 SUB TYPE (BUSINESS LOGIC)
 */
export type CartSubType =
  | "INSTALLATION"
  | "REPAIR"
  | "STERILIZATION"
  | "SERVICE"
  | "COMPRESSOR"
  | "GAS_CHARGING"
  | "COPPER_PIPING"
  | "AMC"
  | "OLD_AC"
  | "OTHER"
  | "PURCHASE_LEAD"
  | "FREE_CONSULTATION";

/**
 * ATTRIBUTES (FIXED)
 */
export interface ICartItemAttributes {
  categoryType: string; // AC / Boiler / Heat Pump
  subType?: string;
  variant?: string;
}

/**
 * FLEXIBLE META
 */
export interface ICartItemMeta {
  brand?: string;
  model?: string;
  age?: string;
  condition?: string;
  issue?: string;
  planType?: string;
  notes?: string;
}

/**
 * CART ITEM
 */
export interface ICartItem {
  type: CartMainType;     // BOOKING | QUOTE_REQUEST
  subType?: CartSubType;

  serviceId?: Types.ObjectId; // <-- make optional
  name?: string;

  quantity: number;
  unitPrice: number;
  totalPrice: number;

  attributes: ICartItemAttributes;
  meta?: ICartItemMeta;
}

/**
 * CATEGORY GROUP (only for BOOKING items)
 */
export interface ICartService {
  category: "AC" | "Boiler" | "Heat Pump";
  items: ICartItem[];
}

/**
 * MAIN CART
 */
export interface ICart {
  userId: Types.ObjectId;

  services: ICartService[];        // BOOKING items
  quoteRequests: ICartItem[];      // QUOTE_REQUEST items (separate array)

  itemTotal: number;
  discount: number;

  tax: {
    vatRate: number;
    vatAmount: number;
  };

  grandTotal: number;

  addressId?: Types.ObjectId;
  slot?: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
  date?: Date;

  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}