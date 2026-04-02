import { Types } from "mongoose";

export interface ICartItem {
  _id?: Types.ObjectId;

  serviceId: Types.ObjectId;
  name: string;
  serviceType: "Sterilization" | "Repair" | "Installation";

  quantity: number;
  unitPrice: number;
  totalPrice?: number;

  attributes: {
    type: string;
    subType?: string;
    variant?: string;
  };
}

export interface ICartService {
  category: "AC" | "Boiler" | "Heat Pump";
  items: ICartItem[];
}

export interface ICart {
  userId: Types.ObjectId;

  services: ICartService[];

  addressId?: Types.ObjectId;

  slot?: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
  date?: Date;

  itemTotal: number;
  discount: number;

  tax: {
    vatRate: number;
    vatAmount: number;
  };

  grandTotal: number;

  isActive: boolean;
}