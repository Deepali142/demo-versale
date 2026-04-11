export enum ErrorCategory {
  INVERTER = "INVERTER",
  NON_INVERTER = "NON_INVERTER",
}

export interface IErrorCode {
  code: string;
  acType?: string;
  models?: string;
  solution: string[];
  category: ErrorCategory;
  description?: string;
}

export interface IBrand {
  name: string;
  logo?: string; 
  isActive: boolean;

  globalErrorCodes: IErrorCode[];

  createdAt: Date;
  updatedAt: Date;
}

export interface AdminCreateEditBrandPayload {
  brandId?: string;
  name: string;
}

export interface BrandListParams {
  page: number;
  limit: number;
  search?: string;
  sortField: string;
  sortOrder: 1 | -1;
}

export interface UserBrandListParams {
  page?: number;
  limit?: number;
  search?: string;
}