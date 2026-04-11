import moment from "moment";
import mongoose, { Types } from "mongoose";
import {
  CreateProductPayload,
  GetFeaturedProductsQuery,
  Specifications,
} from "../../types/product.types";
import { safeDelete } from "../../utils/s3.utils";
import Product from "../../models/shop/product.models";

const leadToEnquiryStatusMap: Record<string, string> = {
  NEW: "REQUESTED",
  CONTACTED: "FOLLOW_UP_REQUIRED",
  FOLLOW_UP: "FOLLOW_UP_REQUIRED",
  CONVERTED: "QUOTE_ACCEPTED",
  LOST: "QUOTE_REJECTED",
};

/* =========================================================
   CREATE PRODUCT
========================================================= */
export const createProductService = async (payload: CreateProductPayload) => {
  const {
    name,
    category,
    pricing,
    specifications = {},
    images = [],
    brand,
    model,
    keyFeatures = [],
    sku,
  } = payload;

  if (!name || !category || !pricing?.mrp || !pricing?.contractorPointPrice) {
    await safeDelete(images);
    throw new Error("Required fields missing");
  }

  if (category === "AC") {
    if (!specifications?.tonnage || specifications?.inverter === undefined) {
      await safeDelete(images);
      throw new Error("AC specifications are incomplete");
    }
  }

  const customerPrice = pricing.discountedPrice || pricing.mrp;

  const count = await Product.countDocuments();
  const productId = `ACDOCPR${moment().format("DDMMYYYY")}-${count + 1}`;

  const product = await Product.create({
    name,
    category,
    brand,
    model,
    keyFeatures,
    images,
    sku,
    productId,
    specifications,
    pricing: {
      ...pricing,
      customerPrice,
    },
  });

  return product;
};

/* =========================================================
   UPDATE PRODUCT
========================================================= */
export const updateProductService = async (productId: string, payload: any) => {
  const { pricing, images, specifications, ...rest } = payload;

  const existingProduct = await Product.findById(productId);

  if (!existingProduct) throw new Error("Product not found");

  let updatedPricing = existingProduct.pricing;

  if (pricing) {
    updatedPricing = {
      ...existingProduct.pricing.toObject(),
      ...pricing,
    };

    updatedPricing.customerPrice =
      updatedPricing.discountedPrice || updatedPricing.mrp;

    if (updatedPricing.discountedPrice && updatedPricing.mrp) {
      updatedPricing.discountedPercentage = Math.round(
        ((updatedPricing.mrp - updatedPricing.discountedPrice) /
          updatedPricing.mrp) *
          100,
      );
    }
  }

  let updatedSpecifications = existingProduct.specifications;

  const baseSpecs = existingProduct.specifications ?? {};

  updatedSpecifications = {
    ...baseSpecs,
    ...specifications,
    eer: specifications?.eer ? Number(specifications.eer) : baseSpecs.eer,
    warranty: {
      ...(baseSpecs.warranty ?? {}),
      ...(specifications?.warranty ?? {}),
    },
  };

  let finalImages = existingProduct.images;

  if (images?.length) {
    finalImages = images;
    await safeDelete(existingProduct.images);
  }

  const updatedProduct = await Product.findByIdAndUpdate(
    productId,
    {
      ...rest,
      pricing: updatedPricing,
      specifications: updatedSpecifications,
      images: finalImages,
    },
    { new: true },
  );

  return updatedProduct;
};

/* =========================================================
   PRODUCT LIST
========================================================= */
export const getProductListService = async (query: any, userId?: string) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const matchStage: any = {
    active: true,
  };

  if (query.search) {
    matchStage.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { brand: { $regex: query.search, $options: "i" } },
    ];
  }

  const pipeline: any[] = [
    { $match: matchStage },

    ...(userId
      ? [
          {
            $lookup: {
              from: "wishlists",
              let: { productId: "$_id" },
              pipeline: [
                {
                  $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                  },
                },
                {
                  $project: {
                    products: 1,
                  },
                },
              ],
              as: "wishlistData",
            },
          },
          {
            $addFields: {
              isWishlisted: {
                $in: [
                  "$_id",
                  {
                    $ifNull: [
                      { $arrayElemAt: ["$wishlistData.products", 0] },
                      [],
                    ],
                  },
                ],
              },
            },
          },
        ]
      : [
          {
            $addFields: {
              isWishlisted: false,
            },
          },
        ]),

    { $skip: skip },
    { $limit: limit },

    {
      $project: {
        wishlistData: 0,
      },
    },
  ];

  const products = await Product.aggregate(pipeline);

  const total = await Product.countDocuments(matchStage);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getProductByIdService = async (
  productId: string,
  userId?: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const pipeline: any[] = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId),
        active: true,
      },
    },

    ...(userId
      ? [
          {
            $lookup: {
              from: "wishlists",
              pipeline: [
                {
                  $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                  },
                },
              ],
              as: "wishlistData",
            },
          },
          {
            $addFields: {
              isWishlisted: {
                $in: [
                  "$_id",
                  {
                    $ifNull: [
                      { $arrayElemAt: ["$wishlistData.products", 0] },
                      [],
                    ],
                  },
                ],
              },
            },
          },
        ]
      : [
          {
            $addFields: {
              isWishlisted: false,
            },
          },
        ]),

    {
      $project: {
        wishlistData: 0,
        __v: 0,
      },
    },
  ];

  const result = await Product.aggregate(pipeline);

  if (!result.length) {
    throw new Error("Product not found");
  }

  return result[0];
};

export const getFeaturedProductsService = async (
  query: GetFeaturedProductsQuery,
  userId?: string,
) => {
  const page = Number.parseInt(query.page || "1", 10);
  const limit = Number.parseInt(query.limit || "10", 10);
  const skip = (page - 1) * limit;

  const pipeline: any[] = [
    {
      $match: {
        featured: true,
        active: true,
      },
    },
  ];

  if (query.productIds) {
    const productIds = Array.isArray(query.productIds)
      ? query.productIds
      : query.productIds.split(",");

    pipeline.push({
      $match: {
        _id: {
          $in: productIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    });
  }

  if (query.brands) {
    const escapeRegex = (text: string) =>
      text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const brands = Array.isArray(query.brands)
      ? query.brands
      : query.brands.split(",");

    const regexBrands = brands.map(
      (b) => new RegExp(`^${escapeRegex(b.trim())}$`, "i"),
    );

    pipeline.push({
      $match: {
        brand: { $in: regexBrands },
      },
    });
  }

  if (userId) {
    pipeline.push(
      {
        $lookup: {
          from: "wishlists",
          pipeline: [
            {
              $match: {
                userId: new mongoose.Types.ObjectId(userId),
              },
            },
            {
              $project: {
                products: 1,
              },
            },
          ],
          as: "wishlistData",
        },
      },
      {
        $addFields: {
          isWishlisted: {
            $in: [
              "$_id",
              {
                $ifNull: [{ $arrayElemAt: ["$wishlistData.products", 0] }, []],
              },
            ],
          },
        },
      },
    );
  } else {
    pipeline.push({
      $addFields: {
        isWishlisted: false,
      },
    });
  }

  pipeline.push({
    $project: {
      _id: 1,
      name: 1,
      brand: 1,
      model: 1,
      featured: 1,
      image: { $arrayElemAt: ["$images", 0] },

      acType: "$specifications.acType",
      tonnage: "$specifications.tonnage",
      inverter: "$specifications.inverter",
      starRating: "$specifications.starRating",
      compressorType: "$specifications.compressorType",
      powerRating: "$specifications.powerRating",
      refrigerant: "$specifications.refrigerant",
      noiseLevel: "$specifications.noiseLevel",

      mrp: "$pricing.mrp",
      customerPrice: "$pricing.customerPrice",
      discountedPercentage: "$pricing.discountedPercentage",

      offerLabel: 1,
      isWishlisted: 1,
    },
  });

  pipeline.push(
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  );

  const products = await Product.aggregate(pipeline);

  const total = await Product.countDocuments({
    featured: true,
    active: true,
  });

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getFeaturedProductByIdService = async (
  productId: string,
  userId?: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const pipeline: any[] = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(productId),
        featured: true,
        active: true,
      },
    },
  ];

  if (userId) {
    pipeline.push(
      {
        $lookup: {
          from: "wishlists",
          pipeline: [
            {
              $match: {
                userId: new mongoose.Types.ObjectId(userId),
              },
            },
            {
              $project: {
                products: 1,
              },
            },
          ],
          as: "wishlistData",
        },
      },
      {
        $addFields: {
          isWishlisted: {
            $in: [
              "$_id",
              {
                $ifNull: [{ $arrayElemAt: ["$wishlistData.products", 0] }, []],
              },
            ],
          },
        },
      },
    );
  } else {
    pipeline.push({
      $addFields: {
        isWishlisted: false,
      },
    });
  }

  pipeline.push({
    $project: {
      stock: 0,
      sku: 0,
      "pricing.contractorPointPrice": 0,
      wishlistData: 0,
    },
  });

  const result = await Product.aggregate(pipeline);

  if (!result.length) {
    throw new Error("Featured product not found");
  }

  return result[0];
};

/* =========================================================
   CREATE INTEREST LEAD
========================================================= */
// export const createInterestedLeadService = async (
//   userId: Types.ObjectId,
//   productId: string,
//   quantity: number,
// ) => {
//   const product = await Product.findById(productId);

//   if (!product || !product.active) {
//     throw new Error("Product not available");
//   }

//   const formattedDate = moment().format("DDMMYYYY");

//   const purchaseId = `ACDOCLEAD${formattedDate}-${await PurchaseLead.countDocuments() + 1}`;
//   const enquiryId = `ENQ${formattedDate}-${await Enquiry.countDocuments() + 1}`;

//   const address = await Address.findOne({ userId, isActive: 1 });

//   const enquiry = await Enquiry.create({
//     user_id: userId,
//     enquiryId,
//     type: "QUOTE_REQUEST",
//     subType: "PURCHASE_LEAD",
//     status: "REQUESTED",
//     noOfAc: quantity,
//     addressDetails: address || {},
//   });

//   const lead = await PurchaseLead.create({
//     purchaseId,
//     userId,
//     productId,
//     quantity,
//     enquiryId: enquiry._id,
//     unitPrice: product.pricing.customerPrice,
//     status: "NEW",
//   });

//   return lead;
// };
