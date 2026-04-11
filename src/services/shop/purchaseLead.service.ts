import mongoose from "mongoose";
import moment from "moment";
import Product from "../../models/shop/product.models";
import PurchaseLead from "../../models/shop/purchaseLead.models";
import Enquiry from "../../models/enquiry/enquiry.model";
import Address from "../../models/user/address.model";

export const createInterestedLeadService = async (
  userId: string,
  productId: string,
  quantity = 1,
) => {
  if (!productId) {
    throw new Error("Product is required");
  }

  const product = await Product.findById(productId).select(
    "pricing.customerPrice active",
  );

  if (!product || !product.active) {
    throw new Error("Product not available");
  }

  const formattedDate = moment().format("DDMMYYYY");

  const totalLeads = await PurchaseLead.countDocuments();
  const purchaseId = `ACDOCLEAD${formattedDate}-${totalLeads + 1}`;

  const enquiryCount = await Enquiry.countDocuments();
  const enquiryIdString = `ENQ${formattedDate}-${enquiryCount + 1}`;

  const address = await Address.findOne({ userId, isActive: true });

  const enquiry = await Enquiry.create({
    user_id: userId,
    enquiryId: enquiryIdString,
    type: "QUOTE_REQUEST",
    subType: "PURCHASE_LEAD",
    status: "REQUESTED",
    noOfAc: quantity,
    addressDetails: {
      house: address?.house || "",
      street: address?.street || "NA",
      city: address?.city || "NA",
      state: address?.state || "NA",
      zipcode: address?.zipcode || "000000",
      saveAs: address?.saveAs || "",
      landmark: address?.landmark || "",
    },
    details: { serviceDetails: [] },
  });

  const lead = await PurchaseLead.create({
    purchaseId,
    userId,
    productId,
    quantity,
    enquiryId: enquiry._id,
    unitPrice: product.pricing.customerPrice,
    status: "NEW",
    source: "APP",
  });

  return {
    purchaseId: lead.purchaseId,
    status: lead.status,
  };
};

/* ========================================================= */

export const createPurchaseLeadService = async (
  userId: string,
  productId: string,
  quantity = 1,
) => {
  if (!userId || !productId) {
    throw new Error("Required fields missing");
  }

  const product = await Product.findById(productId).select(
    "pricing.customerPrice",
  );

  if (!product) {
    throw new Error("Product not found");
  }

  const formattedDate = moment().format("DDMMYYYY");

  const totalLeads = await PurchaseLead.countDocuments();
  const purchaseId = `ACDOCLEAD${formattedDate}-${totalLeads + 1}`;

  const enquiryCount = await Enquiry.countDocuments();
  const enquiryIdString = `ENQ${formattedDate}-${enquiryCount + 1}`;

  const address = await Address.findOne({ userId, isActive: true });

  const enquiry = await Enquiry.create({
    user_id: userId,
    enquiryId: enquiryIdString,
    type: "QUOTE_REQUEST",
    subType: "PURCHASE_LEAD",
    status: "REQUESTED",
    noOfAc: quantity,
    addressDetails: {
      house: address?.house || "",
      street: address?.street || "NA",
      city: address?.city || "NA",
      state: address?.state || "NA",
      zipcode: address?.zipcode || "000000",
      saveAs: address?.saveAs || "",
      landmark: address?.landmark || "",
    },
    details: { serviceDetails: [] },
  });

  const lead = await PurchaseLead.create({
    purchaseId,
    userId,
    productId,
    quantity,
    enquiryId: enquiry._id,
    unitPrice: product.pricing.customerPrice,
  });

  return lead;
};

/* ========================================================= */

export const updatePurchaseLeadService = async (
  purchaseLeadId: string,
  payload: any,
) => {
  const lead = await PurchaseLead.findById(purchaseLeadId);

  if (!lead) {
    throw new Error("Purchase lead id not found");
  }

  const { status, quantity, soldAmount, remarks } = payload;

  if (status) lead.status = status;
  if (quantity) lead.quantity = quantity;
  if (remarks) lead.remarks = remarks;

  if (status === "CONVERTED") {
    if (!soldAmount) {
      throw new Error(
        "Sold amount is required when lead is converted",
      );
    }
    lead.soldAmount = soldAmount;
  }

  await lead.save();

  return lead;
};

/* ========================================================= */

export const getPurchaseLeadsService = async (query: any) => {
  const page = Number.parseInt(query.page ?? "1", 10) || 1;
  const limit = Number.parseInt(query.limit ?? "10", 10) || 10;
  const skip = (page - 1) * limit;

  const matchStage: any = {};

  if (query.status) matchStage.status = query.status;
  if (query.source) matchStage.source = query.source;

  const pipeline: any[] = [{ $match: matchStage }];

  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
  );

  if (query.search) {
    pipeline.push({
      $match: {
        $or: [
          { "user.name": { $regex: query.search, $options: "i" } },
          { "user.phoneNumber": { $regex: query.search, $options: "i" } },
        ],
      },
    });
  }

  pipeline.push(
    { $sort: { createdAt: -1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }],
        totalCount: [{ $count: "count" }],
      },
    },
  );

  const result = await PurchaseLead.aggregate(pipeline);

  return {
    data: result[0].data,
    total: result[0].totalCount[0]?.count || 0,
    page,
    limit,
  };
};

/* ========================================================= */

export const getPurchaseLeadByIdService = async (
  purchaseLeadId: string,
) => {
  const lead = await PurchaseLead.findById(purchaseLeadId)
    .populate("userId", "name phoneNumber email")
    .populate("productId", "name brand pricing.customerPrice");

  if (!lead) {
    throw new Error("Purchase lead not found");
  }

  return lead;
};