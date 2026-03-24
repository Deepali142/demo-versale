import moment from "moment";
import { PipelineStage, Types } from "mongoose";
import {
  Consultancy,
  IConsultancy,
} from "../../models/consultancy/consultancy.model";
import Address from "../../models/user/address.model";
import User from "../../models/user/user.model";
import { Notification } from "../../models/notification/notification.model";
import { uploadToS3 } from "../../utils/s3.utils";
import { sendPushNotification } from "../../utils/notification";

export interface ConsultancyPayload {
  user_id: string;
  brandId: string;
  quantity?: string;
  comment?: string;
  place?: string;
  addressId: string;
  slot: string;
  date: string;
  alternatePhone?: string;
  file?: Express.Multer.File | undefined;
}

export interface AdminCreateConsultancyPayload {
  user_id: string;
  brandId: string;
  alternatePhone?: string;
  documentURL?: string;
  serviceName?: string[];
  consultancyId?: string; // optional (update)
  quantity?: number;
  comment?: string;
  place?: string;
  addressId: string;
  slot: "FIRST_HALF" | "SECOND_HALF";
  date: string;
}

export const createConsultancyService = async (payload: ConsultancyPayload) => {
  const {
    user_id,
    brandId,
    quantity,
    comment,
    place,
    addressId,
    slot,
    date,
    alternatePhone,
    file,
  } = payload;

  // Validate address
  const address = await Address.findById(addressId);
  if (!address) {
    throw new Error("Valid Address ID required");
  }

  // Generate consultancy ID
  const totalConsultancies = await Consultancy.countDocuments();
  const seq = String(totalConsultancies + 1).padStart(5, "0");
  const formattedDate = moment().format("DDMMYYYY");
  const consultancyId = `CONS-${formattedDate}-${seq}`;

  // Upload to S3 if file present
  let fileUrl: string | null = null;
  if (file) {
    const params = {
      Bucket: process.env.BUCKET_NAME!,
      Key: `consultancies/${consultancyId}/${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    const uploadResult = await uploadToS3(params);
    fileUrl = uploadResult.Location;
  }

  // Create Consultancy Entry
  await Consultancy.create({
    user_id: new Types.ObjectId(user_id),
    brandId: new Types.ObjectId(brandId),
    consultancyId,
    addressDetails: address,
    slot,
    alternatePhone,
    date,
    quantity,
    comment,
    place,
    documentURL: fileUrl,
  });

  // Send Push Notification
  const user = await User.findById(user_id).select("deviceToken");
  if (user?.deviceToken) {
    await sendPushNotification(
      user.deviceToken,
      "📦 Consultation request recieved",
      "Your free consultancy request has been submitted.",
    );

    await Notification.create({
      userId: user_id,
      text: "Your free consultancy request has been submitted.",
    });
  }

  return { message: "Request submitted successfully" };
};

export const getConsultancyDetailsService = async (
  consultancyId: string,
): Promise<IConsultancy | null> => {
  if (!Types.ObjectId.isValid(consultancyId)) {
    throw new Error("INVALID_ID");
  }

  const consultancy = await Consultancy.findById(consultancyId).populate(
    "brandId",
    "name",
  );

  return consultancy;
};

export const getUserConsultancyListService = async (
  userId: string,
  page: number,
  limit: number,
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_ID");
  }

  const offset = (page - 1) * limit;

  const list = await Consultancy.aggregate([
    {
      $match: { user_id: new Types.ObjectId(userId) },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brandId",
        foreignField: "_id",
        as: "brandData",
      },
    },
    {
      $unwind: {
        path: "$brandData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: 1,
        place: { $ifNull: ["$place", ""] },
        brandName: { $ifNull: ["$brandData.name", ""] },
        quantity: { $ifNull: ["$quantity", 0] },
        comment: { $ifNull: ["$comment", ""] },
        slot: { $ifNull: ["$slot", ""] },
        alternatePhone: { $ifNull: ["$alternatePhone", ""] },
        documentURL: { $ifNull: ["$documentURL", ""] },
        date: { $ifNull: ["$date", ""] },
        consultancyId: { $ifNull: ["$consultancyId", ""] },
        serviceName: { $ifNull: ["$serviceName", []] },
        addressDetails: { $ifNull: ["$addressDetails", {}] },
        createdAt: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ])
    .skip(offset)
    .limit(limit);

  const total = await Consultancy.countDocuments({
    user_id: new Types.ObjectId(userId),
  });

  return { list, total };
};

export const adminCreateConsultancyService = async (
  payload: AdminCreateConsultancyPayload,
) => {
  const {
    user_id,
    brandId,
    alternatePhone,
    documentURL,
    serviceName,
    consultancyId,
    quantity,
    comment,
    place,
    addressId,
    slot,
    date,
  } = payload;

  // ----------- VALIDATIONS -----------

  if (!Types.ObjectId.isValid(user_id)) {
    throw new Error("INVALID_USER_ID");
  }

  if (!Types.ObjectId.isValid(addressId)) {
    throw new Error("INVALID_ADDRESS_ID");
  }

  if (!Types.ObjectId.isValid(brandId)) {
    throw new Error("INVALID_BRAND_ID");
  }

  // consultancyId is optional, but if passed then validate format
  if (consultancyId && !Types.ObjectId.isValid(consultancyId)) {
    throw new Error("INVALID_CONSULTANCY_ID");
  }

  // ----------- REQUIRED CHECKS ADDED HERE -----------

  if (!slot) {
    throw new Error("SLOT_REQUIRED");
  }

  if (!["FIRST_HALF", "SECOND_HALF"].includes(slot)) {
    throw new Error("INVALID_SLOT");
  }

  if (!date) {
    throw new Error("DATE_REQUIRED");
  }

  if (isNaN(new Date(date).getTime())) {
    throw new Error("INVALID_DATE");
  }

  const address = await Address.findById(addressId);
  if (!address) {
    throw new Error("ADDRESS_NOT_FOUND");
  }

  // ---------------------------------------------------
  // CHECK IF UPDATE OR NEW CREATE
  // ---------------------------------------------------
  let existingConsultancy = null;

  if (consultancyId) {
    existingConsultancy = await Consultancy.findById(consultancyId);
  }

  // ----------- CREATE NEW CONSULTANCY -----------
  if (!existingConsultancy) {
    const total = await Consultancy.countDocuments();
    const sequenceNumber = String(total + 1).padStart(5, "0");
    const formattedDate = moment().format("DDMMYYYY");
    const generatedId = `CONS-${formattedDate}-${sequenceNumber}`;

    await Consultancy.create({
      brandId,
      user_id,
      alternatePhone,
      documentURL,
      consultancyId: generatedId,
      serviceName: serviceName || [],
      addressDetails: address,
      slot,
      date,
      quantity,
      comment,
      place,
    });

    return { message: "Request submitted successfully" };
  }

  // ----------- UPDATE EXISTING CONSULTANCY -----------
  await Consultancy.updateOne(
    { _id: consultancyId },
    {
      serviceName: serviceName || [],
      addressDetails: address,
      brandId,
      alternatePhone,
      documentURL,
      slot,
      date,
      quantity,
      comment,
      place,
    },
  );

  return { message: "Request updated successfully" };
};

export const getAdminConsultancyDetailsService = async (
  consultancyId: string,
) => {
  if (!Types.ObjectId.isValid(consultancyId)) {
    throw new Error("INVALID_ID");
  }

  const results = await Consultancy.aggregate([
    {
      $match: { _id: new Types.ObjectId(consultancyId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brandId",
        foreignField: "_id",
        as: "brandData",
      },
    },
    {
      $unwind: {
        path: "$brandData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "userDetails.name": { $ifNull: ["$userDetails.name", ""] },
        "userDetails.phoneNumber": {
          $ifNull: ["$userDetails.phoneNumber", ""],
        },
        "userDetails.countryCode": {
          $ifNull: ["$userDetails.countryCode", ""],
        },
      },
    },
    {
      $project: {
        _id: 1,
        bookingId: 1,
        serviceDetails: 1,
        alternatePhone: { $ifNull: ["$alternatePhone", ""] },
        documentURL: { $ifNull: ["$documentURL", ""] },
        addressDetails: 1,
        slot: 1,
        date: 1,
        brand: { $ifNull: ["$brandData", {}] },
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        "userDetails.name": 1,
        "userDetails.phoneNumber": 1,
        "userDetails.countryCode": 1,
      },
    },
  ]);

  return results[0] || null;
};

export const adminConsultancyListService = async (
  page: number,
  limit: number,
  search: string,
  sortField: string,
  sortOrder: 1 | -1,
) => {
  const skip = (page - 1) * limit;

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: {
        path: "$userDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "brands",
        localField: "brandId",
        foreignField: "_id",
        as: "brandData",
      },
    },
    {
      $unwind: {
        path: "$brandData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $match: {
        $or: [{ "userDetails.name": { $regex: search, $options: "i" } }],
      },
    },
    {
      $addFields: {
        "userDetails.name": { $ifNull: ["$userDetails.name", ""] },
        "userDetails.phoneNumber": {
          $ifNull: ["$userDetails.phoneNumber", ""],
        },
        "userDetails.countryCode": {
          $ifNull: ["$userDetails.countryCode", ""],
        },
      },
    },
    {
      $project: {
        _id: 1,
        place: { $ifNull: ["$place", ""] },
        quantity: { $ifNull: ["$quantity", 0] },
        alternatePhone: { $ifNull: ["$alternatePhone", ""] },
        documentURL: { $ifNull: ["$documentURL", ""] },
        comment: { $ifNull: ["$comment", ""] },
        slot: { $ifNull: ["$slot", ""] },
        date: { $ifNull: ["$date", ""] },
        consultancyId: { $ifNull: ["$consultancyId", ""] },
        serviceName: { $ifNull: ["$serviceName", []] },
        brandData: { $ifNull: ["$brandData", {}] },
        createdAt: 1,
        userDetails: {
          name: 1,
          phoneNumber: 1,
          countryCode: 1,
        },
      },
    },
    {
      $sort: {
        [sortField]: sortOrder,
      },
    },
    { $skip: skip },
    { $limit: limit },
  ];

  const list = await Consultancy.aggregate(pipeline);

  const totalCountPipeline = [
    ...pipeline.slice(0, 6), // until match + addFields + project
    { $count: "totalCount" },
  ];

  const totalCountResult = await Consultancy.aggregate(totalCountPipeline);
  const totalCount = totalCountResult.length
    ? totalCountResult[0].totalCount
    : 0;

  return { list, totalCount };
};
