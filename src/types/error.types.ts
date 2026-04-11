export interface IUpdateOrCreateErrorCodeInput {
  brandId: string;
  errorCodeId?: string;
  code: string;
  acType: string;
  models: string;
  solution: string[];
  category: "INVERTOR" | "NON_INVERTOR";
  description: string;
}

export interface IErrorCodeListRequest {
  brandId: string;
  errorCode: string;
  acType: "INVERTOR" | "NON_INVERTOR";
}
export interface AdminErrorCodeListParams {
  brandId: string;
}

export interface AdminErrorCodeListQuery {
  page: unknown;
  limit: unknown;
  search: unknown;
  category: unknown;
  sortby: unknown;
  orderby: unknown;
}
 export interface ParsedExcelRow {
  brandname: string;
  modelname: string;
  actype: string;
  "error code": string;
  description: string;
  solution: string;
  category: string;
}