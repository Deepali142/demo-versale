// src/services/leads/leads.service.ts
import moment from "moment";
import Lead, { ILead } from "../../models/leads/leads.model";
import { Types } from "mongoose";
// import { Types } from "mongoose";

const ALLOWED_PLACE = ["commercial", "residential"];

// helper for DDMM format
// const getFormattedDate = (): string => {
//   const now = new Date();
//   const dd = String(now.getDate()).padStart(2, "0");
//   const mm = String(now.getMonth() + 1).padStart(2, "0");
//   return `${dd}${mm}`;
// };

export const createLeadService = async (
  place: string,
  quantity: number,
  userId: string,
  comment?: string,
): Promise<ILead> => {
  // Validation
  if (!place) {
    throw new Error("Place is required");
  }
  if (!userId) {
    throw new Error("User ID is required");
  }
  if (!quantity) {
    throw new Error("Quantity is required");
  }
  if (!ALLOWED_PLACE.includes(place)) {
    throw new Error("Invalid place value. Allowed: commercial, residential");
  }

  const count = await Lead.countDocuments();
  const formattedDate = moment().format("DDMM");
  const leadId = `LEAD-${formattedDate}-${count + 1}`;

  const createdLead = await Lead.create({
    place,
    quantity,
    user_id: userId,
    comment: comment || "",
    leadId,
  });

  return createdLead;
};

export const getUserLeadDetailsService = async (leadId: string) => {
  if (!leadId || leadId.trim() === "") {
    throw new Error("Lead id is required");
  }

  const result = await Lead.aggregate([
    {
      $match: { leadId: leadId }, // match custom string id
    },
    {
      $project: {
        _id: 1,
        place: { $ifNull: ["$place", ""] },
        quantity: { $ifNull: ["$quantity", ""] },
        leadId: { $ifNull: ["$leadId", ""] },
        comment: { $ifNull: ["$comment", ""] },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (result.length === 0) return null;

  return result[0];
};

export const getUserLeadListService = async (
  userId: string,
  page: number,
  limit: number,
) => {
  if (!userId || userId.trim() === "") {
    throw new Error("User ID is required");
  }

  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid userId format");
  }

  const offset = (page - 1) * limit;

  const leads = await Lead.aggregate([
    {
      $match: { user_id: new Types.ObjectId(userId) },
    },
    {
      $project: {
        _id: 1,
        place: { $ifNull: ["$place", ""] },
        quantity: { $ifNull: ["$quantity", 0] },
        comment: { $ifNull: ["$comment", ""] },
        leadId: { $ifNull: ["$leadId", ""] },
        createdAt: 1,
      },
    },
    { $sort: { createdAt: -1 } },
    { $skip: offset },
    { $limit: limit },
  ]);

  const totalLeads = await Lead.countDocuments({
    user_id: new Types.ObjectId(userId),
  });

  return { leads, totalLeads };
};

export const getAdminLeadListService = async (
  page: number,
  limit: number,
  search: string,
  sortField: string,
  sortOrder: 1 | -1,
) => {
  const offset = (page - 1) * limit;

  const filter = {
    $or: [
      { place: { $regex: search, $options: "i" } },
      { "userDetails.name": { $regex: search, $options: "i" } },
      { "userDetails.phoneNumber": { $regex: search, $options: "i" } },
    ],
  };

  // ------- Fetch paginated list -------
  const leads = await Lead.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    { $match: filter },
    {
      $project: {
        _id: 1,
        place: { $ifNull: ["$place", ""] },
        quantity: { $ifNull: ["$quantity", 0] },
        comment: { $ifNull: ["$comment", ""] },
        leadId: { $ifNull: ["$leadId", ""] },
        createdAt: 1,
        updatedAt: 1,
        userDetails: {
          _id: 1,
          name: 1,
          email: 1,
          phoneNumber: 1,
        },
      },
    },
    { $sort: { [sortField]: sortOrder } },
    { $skip: offset },
    { $limit: limit },
  ]);

  // ------- Total count (with same filters) -------
  const totalCount = await Lead.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    { $match: filter },
    { $count: "total" },
  ]);

  const totalLeads = totalCount.length ? totalCount[0].total : 0;

  return { leads, totalLeads };
};

export const getAdminLeadDetailsService = async (leadId: string) => {
  if (!leadId || leadId.trim() === "") {
    throw new Error("Lead id is required");
  }

  if (!Types.ObjectId.isValid(leadId)) {
    throw new Error("Invalid leadId format");
  }

  const result = await Lead.aggregate([
    { $match: { _id: new Types.ObjectId(leadId) } },
    {
      $project: {
        _id: 1,
        place: { $ifNull: ["$place", ""] },
        quantity: { $ifNull: ["$quantity", ""] },
        comment: { $ifNull: ["$comment", ""] },
        leadId: { $ifNull: ["$leadId", ""] },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return result.length > 0 ? result[0] : null;
};
