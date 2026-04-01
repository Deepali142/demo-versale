import { Types, HydratedDocument } from "mongoose";

/* -------- TAX (UK VAT) -------- */
interface ITax {
  vatRate: number;                  // e.g. 20
  vatAmount: Types.Decimal128;
}

/* -------- ATTRIBUTES -------- */
interface IServiceAttributes {
  type: "AC" | "Boiler" | "Heat Pump";   
  subType?: string;                      
  variant?: string;                      
}

/* -------- SERVICE ITEM -------- */
interface IServiceItem {
  serviceId?: Types.ObjectId;

  name: string;

  //  NEW
  serviceType: "Sterilization" | "Repair" | "Installation";

  quantity: number;

  unitPrice: Types.Decimal128;
  totalPrice: Types.Decimal128;

  attributes: IServiceAttributes;
}

/* -------- CATEGORY -------- */
interface IServiceCategory {
  category: "AC" | "Boiler" | "Heat Pump";
  items: IServiceItem[];
}

/* -------- BOOKING -------- */
export interface IBooking {
  _id: Types.ObjectId;

  user_id: Types.ObjectId;
  bookingId: string;

  services: IServiceCategory[];

  address: Record<string, any>;

  slot: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
  date: Date;

  itemTotal: Types.Decimal128;
  discount: Types.Decimal128;

  tax: ITax;

  grandTotal: Types.Decimal128;

  currency?: "GBP";

  order_id?: string;
  enquiryId: Types.ObjectId;

  //  OPTIONAL BUT IMPORTANT
  status?: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

  assigned_to?: Types.ObjectId;

  invoiceUrl?: string;
  invoiceId?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

/* -------- DOCUMENT TYPE -------- */
export type BookingDocument = HydratedDocument<IBooking>;