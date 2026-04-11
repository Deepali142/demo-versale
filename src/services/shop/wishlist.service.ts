import mongoose from "mongoose";
import Wishlist from "../../models/shop/wishlist.model";
import Product from "../../models/shop/product.models";

export const addToWishlistService = async (
  userId: mongoose.Types.ObjectId,
  productId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const product = await Product.findById(productId);

  if (!product || !product.active) {
    throw new Error("Product not available");
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { userId },
    {
      $addToSet: { products: productId },
    },
    { new: true, upsert: true },
  );

  return wishlist;
};

export const removeFromWishlistService = async (
  userId: mongoose.Types.ObjectId,
  productId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new Error("Invalid product ID");
  }

  const wishlist = await Wishlist.findOneAndUpdate(
    { userId },
    {
      $pull: { products: productId },
    },
    { new: true },
  );

  return wishlist;
};

export const getWishlistService = async (userId: mongoose.Types.ObjectId) => {
  const result = await Wishlist.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
      },
    },

    {
      $lookup: {
        from: "products",
        localField: "products",
        foreignField: "_id",
        as: "products",
      },
    },

    {
      $unwind: {
        path: "$products",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $project: {
        _id: 0,
        productId: "$products._id",
        name: "$products.name",
        brand: "$products.brand",
        image: { $arrayElemAt: ["$products.images", 0] },

        customerPrice: "$products.pricing.customerPrice",
        discountedPercentage: "$products.pricing.discountedPercentage",

        offerLabel: "$products.offerLabel",
      },
    },

    {
      $group: {
        _id: null,
        products: { $push: "$$ROOT" },
      },
    },

    {
      $project: {
        _id: 0,
        products: 1,
      },
    },
  ]);

  return result[0] || { products: [] };
};

export const toggleWishlistService = async (
  userId: mongoose.Types.ObjectId,
  productId: string,
) => {
  const exists = await Wishlist.findOne({
    userId,
    products: productId,
  });

  if (exists) {
    await Wishlist.updateOne({ userId }, { $pull: { products: productId } });

    return { action: "REMOVED" };
  } else {
    await Wishlist.findOneAndUpdate(
      { userId },
      { $addToSet: { products: productId } },
      { upsert: true },
    );

    return { action: "ADDED" };
  }
};
