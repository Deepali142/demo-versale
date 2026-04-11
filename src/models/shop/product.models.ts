import mongoose, { Schema, Document, Model } from "mongoose";
import { ACType, IProduct, ProductCategory } from "../../types/product.types";

/* =========================
   SCHEMA
========================= */

const productSchema: Schema<IProduct> = new Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    images: [
      {
        type: String,
      },
    ],

    category: {
      type: String,
      enum: Object.values(ProductCategory),
      required: true,
    },

    subCategory: {
      type: String,
    },

    sku: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls
    },

    brand: String,
    model: String,
    offerLabel: String,

    pricing: {
      mrp: { type: Number, required: true },
      discountedPrice: Number,
      customerPrice: { type: Number, required: true },
      contractorPointPrice: { type: Number, required: true },
      discountedPercentage: Number,
    },

    stock: {
      type: Number,
      default: 0,
    },

    minOrderQty: {
      type: Number,
      default: 1,
    },

    specifications: {
      acType: {
        type: String,
        enum: Object.values(ACType),
      },

      tonnage: Number,
      inverter: Boolean,
      starRating: Number,

      compressorType: String,

      eer: String,
      powerConsumption: String,
      powerRequirement: String,
      powerSupply: String,

      coolingCapacity: String,
      refrigerant: String,
      ambientTemperature: String,

      airFlowDirection: String,
      airFilterType: String,
      dustFilter: Boolean,
      antiBacteria: Boolean,

      indoorUnitDimensions: String,
      indoorUnitWeight: String,
      outdoorUnitWeight: String,
      bodyMaterial: String,
      color: String,

      installationKit: Boolean,
      connectingPipeLength: String,
      copperPipe: Boolean,

      remoteControl: Boolean,
      sleepMode: Boolean,
      autoRestart: Boolean,
      selfDiagnosis: Boolean,
      timer: Boolean,
      display: Boolean,
      wifiConnectivity: Boolean,

      noiseLevel: String,

      specialFeatures: [String],

      warranty: {
        product: String,
        compressor: String,
      },
    },

    featured: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey:false
  }
);

/* =========================
   INDEXES
========================= */

productSchema.index({ category: 1 });
productSchema.index({ brand: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ "pricing.customerPrice": 1 });

/* =========================
   MODEL
========================= */

const Product: Model<IProduct> = mongoose.model<IProduct>(
  "Product",
  productSchema
);

export default Product;