// src/services/leads/leads.service.ts
import moment from "moment";
import Lead, { ILead } from "../../models/leads/leads.model";
import { Types } from "mongoose";
const ALLOWED_PLACE = ["commercial", "residential"];

interface ILeadResponse {
  _id: string;
  place: string;
  quantity: number;
  leadId: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

// helper for DDMM format
// const getFormattedDate = (): string => {
//   const now = new Date();
//   const dd = String(now.getDate()).padStart(2, "0");
//   const mm = String(now.getMonth() + 1).padStart(2, "0");
//   return `${dd}${mm}`;
// };

type PlaceType = (typeof ALLOWED_PLACE)[number];

export const createLeadService = async (
  place: PlaceType,
  quantity: number,
  userId: string,
  comment?: string,
): Promise<ILead> => {
  if (!place) {
    throw new Error("Place is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
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
    user_id: new Types.ObjectId(userId), // ✅ FIXED
    comment: comment || "",
    leadId,
  });

  return createdLead;
};

export const getUserLeadDetailsService = async (
  leadId: string,
): Promise<ILeadResponse | null> => {
  if (!leadId || leadId.trim() === "") {
    throw new Error("Lead id is required");
  }

  const lead = await Lead.findOne({ leadId: leadId.trim() })
    .select("_id place quantity leadId comment createdAt updatedAt")
    .lean();

  if (!lead) return null;

  return {
    _id: (lead._id as Types.ObjectId).toHexString(),
    place: lead.place || "",
    quantity: lead.quantity ?? 0,
    leadId: lead.leadId || "",
    comment: lead.comment || "",
    createdAt: lead.createdAt as Date,
    updatedAt: lead.updatedAt as Date,
  };
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
  page: number = 1,
  limit: number = 10,
  search: string = "",
  sortField: string = "createdAt",
  sortOrder: 1 | -1 = -1,
) => {
  const offset = (page - 1) * limit;

  const allowedSortFields = ["createdAt", "place", "quantity"];
  const safeSortField = allowedSortFields.includes(sortField)
    ? sortField
    : "createdAt";

  const matchStage =
    search && search.trim() !== ""
      ? {
          $or: [
            { place: { $regex: search, $options: "i" } },
            { "userDetails.name": { $regex: search, $options: "i" } },
            { "userDetails.phoneNumber": { $regex: search, $options: "i" } },
          ],
        }
      : {};

  const pipeline = [
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },
    { $match: matchStage },
  ];

  const leads = await Lead.aggregate([
    ...pipeline,
    {
      $project: {
        _id: { $toString: "$_id" }, // ✅ FIX
        place: { $ifNull: ["$place", ""] },
        quantity: { $ifNull: ["$quantity", 0] },
        comment: { $ifNull: ["$comment", ""] },
        leadId: { $ifNull: ["$leadId", ""] },
        createdAt: 1,
        updatedAt: 1,
        userDetails: {
          _id: { $toString: "$userDetails._id" },
          name: "$userDetails.name",
          email: "$userDetails.email",
          phoneNumber: "$userDetails.phoneNumber",
        },
      },
    },
    { $sort: { [safeSortField]: sortOrder } },
    { $skip: offset },
    { $limit: limit },
  ]);

  const totalResult = await Lead.aggregate([
    ...pipeline,
    { $count: "total" },
  ]);

  const totalLeads = totalResult[0]?.total || 0;

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
        _id: { $toString: "$_id" }, // ✅ FIX
        place: { $ifNull: ["$place", ""] },
        quantity: { $ifNull: ["$quantity", 0] }, // ✅ FIX
        comment: { $ifNull: ["$comment", ""] },
        leadId: { $ifNull: ["$leadId", ""] },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  return result.length ? result[0] : null;
};
