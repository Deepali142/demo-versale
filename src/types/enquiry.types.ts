import { Types } from "mongoose";

export type EnquirySubType = "OLD_AC" | "COPPER_PIPING" | "BOOKING";

export interface IServiceItem {
  service_id: Types.ObjectId | string;
  acType?: string;
  quantity?: number;
}

export interface ICopperPipingDetails {
  propertyType: string;
  acTypes: string[];
  outdoorUnitLocation: string;
  pipeLength: number;
  additionalNotes?: string;
  images: string[];
}

export interface IOldAcDetails {
  brand?: string;
  tonnage?: number;
  images?: string[];
}
 interface IServiceInput {
  service_id: Types.ObjectId | string;

  serviceType?: "Sterilization" | "Repair" | "Installation"; 

  quantity?: number;

  attributes?: {
    subType?: string;
    variant?: string;
  };
}
export interface ICreateEnquiryPayload {
  addressId: Types.ObjectId | string;
  slot: string;
  date: string;

  name?: string;
  subType: EnquirySubType;

  oldAcDetails?: IOldAcDetails;
  copperPipingDetails?: ICopperPipingDetails;

  serviceDetails: IServiceInput[];
  amount?: number;
  order_id?: string;
}

export interface IUserContext {
  _id: Types.ObjectId;
}

export interface IGetEnquiriesQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortby?: string;
  orderby?: "asc" | "desc";
}

export interface IUserContext {
  _id: Types.ObjectId;
}

export interface IGetEnquiriesParams {
  userId?: string;
}

export interface IEnquiryResponse {
  enquiryId: string;
  type: string;
  subType: string;
  status: string;
  createdAt: Date;
}