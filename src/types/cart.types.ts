// src/types/cart.types.ts
import { Types } from "mongoose";

/** Attributes for a single cart item */
export interface ICartItemAttributes {
  type: string;         // Required
  subType?: string;     // Optional
  variant?: string;     // Optional
}

/** Single item in a cart category */
export interface ICartItem {
  serviceId: Types.ObjectId;
  name: string;
  serviceType: "Sterilization" | "Repair" | "Installation";
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  attributes: ICartItemAttributes;
}

/** Group of items under a category */
export interface ICartService {
  category: "AC" | "Boiler" | "Heat Pump";
  items: ICartItem[];
}

/** Main cart interface */
export interface ICart {
  userId: Types.ObjectId;
  services: ICartService[];
  itemTotal: number;
  discount: number;
  tax: {
    vatRate: number;
    vatAmount: number;
  };
  grandTotal: number;
  addressId?: Types.ObjectId;                        // Optional
  slot?: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY"; // Optional
  date?: Date;                                      // Optional
  isActive: boolean;
  createdAt?: Date;                                 // Optional for timestamps
  updatedAt?: Date;                                 // Optional for timestamps
}