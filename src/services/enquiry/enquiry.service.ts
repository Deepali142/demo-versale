import moment from "moment";
import { Types, FilterQuery } from "mongoose";

import { ICreateEnquiryPayload, IUserContext } from "../../types/enquiry.types";
import Address from "../../models/user/address.model";
import Enquiry from "../../models/enquiry/enquiry.model";
import { Service } from "../../models/service/service.model";
import { Booking } from "../../models/booking/booking.model";
import User from "../../models/user/user.model";
import { Notification } from "../../models/notification/notification.model";

import { handleOldAcEnquiry } from "../../utils/oldAc";
import { sendPushNotification } from "../../utils/notification";
import { BookingDocument } from "../../types/booking.types";

/* ================= TYPES ================= */

interface IServiceLean {
  _id: Types.ObjectId;
  name: string;
  price?: number;
  category?: "AC" | "Boiler" | "Heat Pump";
}

interface IServiceItem {
  serviceId: Types.ObjectId;

  name: string;

  serviceType: "Sterilization" | "Repair" | "Installation";

  quantity: number;

  unitPrice: Types.Decimal128;
  totalPrice: Types.Decimal128;

  attributes: {
    type: "AC" | "Boiler" | "Heat Pump";
    subType?: string;
    variant?: string;
  };
}

interface IServiceInput {
  serviceId: Types.ObjectId | string;

  serviceType?: "Sterilization" | "Repair" | "Installation";

  quantity?: number;

  attributes?: {
    type?: "AC" | "Boiler" | "Heat Pump";
    subType?: string;
    variant?: string;
  };
}

interface IGetEnquiryServiceInput {
  userId: string;
  page: number;
  limit: number;
  search?: string;
  sortField: string;
  sortOrder: 1 | -1;
}

interface IEnquiryDoc {
  _id: Types.ObjectId;
  user_id: Types.ObjectId;
  status: string;
  subType: string;
  type: string;
  enquiryId: string;
}
/* ================= CREATE ENQUIRY ================= */

export const createEnquiryService = async (
  body: ICreateEnquiryPayload,
  user: IUserContext,
) => {
  const formattedDate = moment().format("DDMMYYYY");

  const {
    addressId,
    slot,
    date,
    oldAcDetails,
    subType,
    serviceDetails,
    order_id,
  } = body;

  const user_id = user?._id;

  if (!user_id) throw new Error("USER_ID_REQUIRED");
  if (!addressId) throw new Error("ADDRESS_REQUIRED");
  if (!slot) throw new Error("SLOT_REQUIRED");

  if (!date || isNaN(new Date(date).getTime())) {
    throw new Error("INVALID_DATE");
  }

  const address = await Address.findById(addressId).lean();
  if (!address) throw new Error("INVALID_ADDRESS");

  const countTotalEnquiry = await Enquiry.countDocuments();
  const enquiryId = `ACDEQ${formattedDate}-${countTotalEnquiry + 1}`;

  const newEnquiry = await Enquiry.create({
    user_id,
    enquiryId,
    addressDetails: address,
    schedule: {
      slot,
      date: new Date(date),
    },
    type: "QUOTE_REQUEST",
    subType,
    status: "REQUESTED",
  });

  /* -------- OLD AC -------- */
  let oldAcDoc: Record<string, unknown> | null = null;

  if (subType === "OLD_AC") {
    if (!Array.isArray(oldAcDetails) || !oldAcDetails.length) {
      throw new Error("OLD_AC_DETAILS_REQUIRED");
    }

    const result = await handleOldAcEnquiry({
      enquiryId: newEnquiry._id as Types.ObjectId,
      oldAcDetails,
    });

    oldAcDoc = result.oldAcDoc.toObject();
    newEnquiry.noOfAc = result.noOfAc;
    await newEnquiry.save();
  }

  /* -------- BOOKING -------- */
  let bookingData: BookingDocument | null = null;

  if (subType === "BOOKING") {
    if (!serviceDetails?.length) {
      throw new Error("SERVICE_DETAILS_REQUIRED");
    }

    const serviceIds = serviceDetails.map((s) =>
      typeof s.service_id === "string"
        ? new Types.ObjectId(s.service_id)
        : s.service_id,
    );

    const servicesFromDB = await Service.find({
      _id: { $in: serviceIds },
    })
      .select("name price category")
      .lean<IServiceLean[]>();

    const serviceMap = new Map(
      servicesFromDB.map((s) => [s._id.toString(), s]),
    );

    const categoryMap = new Map<string, IServiceItem[]>();
    let itemTotal = 0;

    for (const item of serviceDetails) {
      const service = serviceMap.get(item.service_id.toString());
      if (!service) continue;

      const quantity = Math.max(1, Number(item.quantity ?? 1));
      const unitPrice = Number(service.price ?? 0);
      const totalPrice = unitPrice * quantity;

      itemTotal += totalPrice;

      const category = service.category || "AC";

      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }

      const validServiceTypes = ["Repair", "Installation", "Sterilization"];

      const serviceType: "Sterilization" | "Repair" | "Installation" =
        validServiceTypes.includes(item.serviceType as string)
          ? (item.serviceType as "Sterilization" | "Repair" | "Installation")
          : "Repair";

      categoryMap.get(category)!.push({
        serviceId: service._id,
        name: service.name,
        serviceType,

        quantity,

        unitPrice: Types.Decimal128.fromString(unitPrice.toString()),
        totalPrice: Types.Decimal128.fromString(totalPrice.toString()),
        attributes: {
          type: category,
          subType: item.attributes?.subType || "",
          variant: item.attributes?.variant || "",
        },
      });
    }

    const services = Array.from(categoryMap.entries()).map(
      ([category, items]) => ({
        category,
        items,
      }),
    );

    /* -------- PRICING (UK VAT) -------- */
    const discount = 0;
    const vatRate = 20;

    const taxableAmount = itemTotal - discount;
    const vatAmount = (taxableAmount * vatRate) / 100;
    const grandTotal = taxableAmount + vatAmount;

    const bookingId = `ACDOCBK${Date.now()}`;

    bookingData = await Booking.create({
      user_id,
      bookingId,
      services,
      address,
      slot,
      date: new Date(date),

      itemTotal: Types.Decimal128.fromString(itemTotal.toString()),
      discount: Types.Decimal128.fromString(discount.toString()),

      tax: {
        vatRate,
        vatAmount: Types.Decimal128.fromString(vatAmount.toString()),
      },

      grandTotal: Types.Decimal128.fromString(grandTotal.toString()),

      order_id: order_id || "",
      enquiryId: newEnquiry._id,
    });

    newEnquiry.bookingId = bookingData._id;
    newEnquiry.status = "BOOKING_CREATED";

    await newEnquiry.save();
  }

  /* -------- NOTIFICATION -------- */
  const userData = await User.findById(user_id).select("deviceToken name");

  if (userData?.deviceToken) {
    await sendPushNotification(
      userData.deviceToken,
      "Booking Created",
      "Your service booking has been created successfully.",
    );

    await Notification.create({
      userId: user_id,
      title: "Booking Created",
      text: "Your service booking has been created successfully.",
    });
  }

  return {
    enquiry: newEnquiry,
    oldAcDetails: oldAcDoc,
    bookingDetails: bookingData,
  };
};

/* ================= LIST ================= */

export const getEnquiriesByUserService = async ({
  userId,
  page,
  limit,
  search,
  sortField,
  sortOrder,
}: IGetEnquiryServiceInput) => {
  const offset = (page - 1) * limit;

  const matchQuery: FilterQuery<IEnquiryDoc> = {
    user_id: new Types.ObjectId(userId),
    type: { $ne: "BOOKING" },
  };

  if (search) {
    matchQuery.$or = [
      { status: { $regex: search, $options: "i" } },
      { subType: { $regex: search, $options: "i" } },
      { type: { $regex: search, $options: "i" } },
      { enquiryId: { $regex: search, $options: "i" } },
    ];
  }

  const enquiries = await Enquiry.aggregate<IEnquiryDoc>([
    { $match: matchQuery },
    { $sort: { [sortField]: sortOrder } },
    { $skip: offset },
    { $limit: limit },
  ]);

  const totalCount = await Enquiry.countDocuments(matchQuery);

  return {
    enquiries,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  };
};

/* ================= GET BY ID ================= */

export const getEnquiryByIdService = async (enquiryId: string) => {
  const enquiryObjectId = new Types.ObjectId(enquiryId);

  const enquiry = await Enquiry.aggregate<IEnquiryDoc>([
    { $match: { _id: enquiryObjectId } },
  ]);

  return enquiry[0] || null;
};
