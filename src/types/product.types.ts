import { Document } from "mongoose";

/* =========================
   ENUMS
========================= */

export enum ProductCategory {
  AC = "AC",
  TOOLS = "TOOLS",
  SPARE_PARTS = "SPARE_PARTS",
  CONSUMABLES = "CONSUMABLES",
  ACCESSORIES = "ACCESSORIES",
}

export enum ACType {
  SPLIT = "SPLIT",
  WINDOW = "WINDOW",
  CASSETTE = "CASSETTE",
  DUCTABLE = "DUCTABLE",
  TOWER = "TOWER",
  VRF = "VRF",
  VRV = "VRV",
  CHILLER = "CHILLER",
  CONCEALED = "CONCEALED",
}

/* =========================
   SUB TYPES
========================= */

export interface IWarranty {
  product?: string;
  compressor?: string;
}

export interface ISpecifications {
  acType?: ACType;
  tonnage?: number;
  inverter?: boolean;
  starRating?: number;

  compressorType?: string;

  eer?: string;
  powerConsumption?: string;
  powerRequirement?: string;
  powerSupply?: string;

  coolingCapacity?: string;
  refrigerant?: string;
  ambientTemperature?: string;

  airFlowDirection?: string;
  airFilterType?: string;
  dustFilter?: boolean;
  antiBacteria?: boolean;

  indoorUnitDimensions?: string;
  indoorUnitWeight?: string;
  outdoorUnitWeight?: string;
  bodyMaterial?: string;
  color?: string;

  installationKit?: boolean;
  connectingPipeLength?: string;
  copperPipe?: boolean;

  remoteControl?: boolean;
  sleepMode?: boolean;
  autoRestart?: boolean;
  selfDiagnosis?: boolean;
  timer?: boolean;
  display?: boolean;
  wifiConnectivity?: boolean;

  noiseLevel?: string;

  specialFeatures?: string[];

  warranty?: IWarranty;
}

export interface IPricing {
  toObject(): IPricing;
  mrp: number;
  discountedPrice?: number;
  customerPrice: number;
  contractorPointPrice: number;
  discountedPercentage?: number;
}

/* =========================
   MAIN PRODUCT INTERFACE
========================= */

export interface IProduct {
  productId: string;
  name: string;
  description?: string;
  images: string[];

  category: ProductCategory;
  subCategory?: string;

  sku?: string;
  brand?: string;
  model?: string;
  offerLabel?: string;

  pricing: IPricing;

  stock: number;
  minOrderQty: number;

  specifications?: ISpecifications;

  featured: boolean;
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}
export interface Pricing {
  mrp: number;
  discountedPrice?: number;
  contractorPointPrice: number;
  customerPrice?: number;
  discountedPercentage?: number;
}

export interface Warranty {
  product?: string;
  compressor?: string;
}

export interface Specifications {
  acType?: string;
  tonnage?: number;
  inverter?: boolean;
  starRating?: number;
  compressorType?: string;

  eer?: number;
  powerConsumption?: string;

  coolingCapacity?: string;
  refrigerant?: string;

  noiseLevel?: string;

  specialFeatures?: string[];

  warranty?: Warranty;
}

export interface CreateProductPayload {
  name: string;
  category: string;
  brand?: string;
  model?: string;
  keyFeatures?: string[];
  sku?: string;
  images: string[];
  pricing: Pricing;
  specifications?: Specifications;
}

export interface GetFeaturedProductsQuery {
  page?: string;
  limit?: string;
  productIds?: string | string[];
  brands?: string | string[];
}
