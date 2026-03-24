import moment from "moment";
import { Booking } from "../../models/booking/booking.model";
import Address, { IAddress } from "../../models/user/address.model";
import { IService, Service } from "../../models/service/service.model";
import User, { IUser } from "../../models/user/user.model";
import { sendPushNotification } from "../../utils/notification";
import { Notification } from "../../models/notification/notification.model";
import { Types } from "mongoose";
import Technician, {
  ITechnician,
} from "../../models/technician/technician.model";
import { PipelineStage } from "mongoose";
import { calculateTotal } from "../../utils/calculateTotal";

// Interface for Service Details
interface IServiceDetail {
  service_id: Types.ObjectId;
  serviceType?: string;
  quantity: string;
  acType?: string;
  place?: string;
  otherService?: string;
  comment?: string;
  services?: unknown[];
}

// Interface for Create Booking input
interface ICreateBookingInput {
  user_id: Types.ObjectId;
  serviceDetails: IServiceDetail[];
  addressId: Types.ObjectId;
  slot: "FIRST_HALF" | "SECOND_HALF";
  date: string | Date;
  amount: number | string;
  order_id?: string;
  name: string;
}

interface IBookingResponse {
  _id: Types.ObjectId;
  bookingId: string;
  user_id: Types.ObjectId;
  slot: string;
  date: Date;
}

export interface IOrderItem {
  _id: string;
  item: string;
  quantity: string;
  price: number;
}

export interface IBookingResponseById {
  _id: string;
  bookingId: string;
  user: IUser;
  technician?: ITechnician;
  addressDetails?: IAddress;
  date: Date;
  slot: string;
  amount: number;
  status: string;
  order_id?: string;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  serviceDetails: IService[];
  orderItems: IOrderItem[];
}

interface IEditBookingParams {
  bookingId: string;
  serviceDetails?: IServiceDetail[];
  addressId: IAddress;
  slot: "FIRST_HALF" | "SECOND_HALF";
  date: string;
  amount: number;
}

interface BookingQuery {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
  sortby?: string;
  orderby?: string;
  startDate?: string;
  endDate?: string;
  filter?: string;
}

// Service function to create a booking
export const createBooking = async (
  data: ICreateBookingInput,
): Promise<IBookingResponse> => {
  const {
    user_id,
    serviceDetails,
    addressId,
    slot,
    date,
    amount,
    order_id,
    name,
  } = data;

  // 1. Validate fields
  if (!user_id) throw new Error("User ID is required");
  if (!name) throw new Error("Name is required for booking");
  if (!addressId) throw new Error("Address ID is required");
  if (!slot) throw new Error("Slot is required");
  if (!date || isNaN(new Date(date).getTime())) throw new Error("Invalid date");
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    throw new Error("Invalid booking amount");
  }

  // 2. Verify address
  const address = await Address.findById(addressId);
  if (!address) throw new Error("Invalid Address ID");

  // 3. Generate booking ID
  const formattedDate = moment().format("DDMMYYYY");
  const countTotalBooking = await Booking.countDocuments();
  const bookingId = `ACDOCBK${formattedDate}-${countTotalBooking + 1}`;

  // 4. Prepare order items
  const orderItems: {
    item: string;
    quantity: string;
    price: number;
  }[] = [];

  for (const item of serviceDetails) {
    const findService = await Service.findById(item.service_id).select("name");
    if (!findService) continue;

    orderItems.push({
      item: `${findService.name} ${item.acType || ""}`.trim(),
      quantity: item.quantity,
      price: 0,
    });
  }

  // 5. Create booking
  const booking = new Booking({
    user_id,
    bookingId,
    serviceDetails,
    addressDetails: address,
    slot,
    date: new Date(date),
    amount: amount.toString(),
    order_id: order_id || "",
    orderItems,
  });

  const savedBooking = await booking.save();

  // 6. Send notification
  const user = await User.findById(user_id).select("deviceToken name");
  if (user) {
    if (!user.name) await User.updateOne({ _id: user_id }, { name });

    if (user.deviceToken) {
      const title = "Booking";
      const body = "Your booking has been successfully created!";
      await sendPushNotification(user.deviceToken, title, body);

      await Notification.create({
        userId: user_id,
        text: body,
      });
    }
  }

  // 7. return only the necessary booking details
  return {
    _id: savedBooking._id as Types.ObjectId,
    bookingId: savedBooking.bookingId,
    user_id: savedBooking.user_id,
    slot: savedBooking.slot,
    date: savedBooking.date,
  };
};

// Service function to get booking details by bookingId with aggregation.
export async function fetchBookingById(
  bookingId: string,
): Promise<IBookingResponse | null> {
  const bookingData = await Booking.aggregate([
    {
      $match: { _id: new Types.ObjectId(bookingId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
    { $unwind: { path: "$serviceDetails", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "services",
        localField: "serviceDetails.service_id",
        foreignField: "_id",
        as: "serviceDetails.service_data",
        pipeline: [
          { $project: { _id: 1, name: 1, icon: 1, category: 1, key: 1 } },
        ],
      },
    },
    {
      $unwind: {
        path: "$serviceDetails.service_data",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "technicians",
        localField: "assigned_to",
        foreignField: "_id",
        as: "technician_data",
      },
    },
    { $unwind: { path: "$technician_data", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$_id",
        bookingId: { $first: "$bookingId" },
        user: { $first: "$user_info" },
        technician: { $first: "$technician_data" },
        addressDetails: { $first: "$addressDetails" },
        date: { $first: "$date" },
        slot: { $first: "$slot" },
        amount: { $first: { $toDouble: "$amount" } },
        status: { $first: "$status" },
        order_id: { $first: "$order_id" },
        invoiceUrl: { $first: "$invoiceUrl" },
        invoiceId: { $first: "$invoiceId" },
        createdAt: { $first: "$createdAt" },
        updatedAt: { $first: "$updatedAt" },
        serviceDetails: {
          $push: {
            service_id: "$serviceDetails.service_id",
            service_data: "$serviceDetails.service_data",
            serviceType: "$serviceDetails.serviceType",
            quantity: "$serviceDetails.quantity",
            acType: "$serviceDetails.acType",
            place: "$serviceDetails.place",
            comment: "$serviceDetails.comment",
            otherService: { $ifNull: ["$serviceDetails.otherService", ""] },
            services: "$serviceDetails.services",
          },
        },
        orderItems: { $first: "$orderItems" },
      },
    },
  ]);

  if (!bookingData.length) return null;
  return bookingData[0] as IBookingResponse;
}

// Service function to update a booking
export const updateBooking = async ({
  bookingId,
  serviceDetails,
  addressId,
  slot,
  date,
  amount,
}: IEditBookingParams) => {
  // Check if booking exists
  const existingBooking = await Booking.findById(new Types.ObjectId(bookingId));
  if (!existingBooking) return null;

  // Check if address exists
  const address = await Address.findById(addressId);
  if (!address) throw new Error("Invalid address ID");

  // Update booking fields
  existingBooking.serviceDetails =
    serviceDetails || existingBooking.serviceDetails;
  existingBooking.addressDetails = [address];
  existingBooking.slot = slot;
  existingBooking.date = new Date(date);
  existingBooking.amount = new Types.Decimal128(amount.toString());

  await existingBooking.save();

  return existingBooking;
};

// Service function to get list of bookings with filters, pagination, and sorting
export const fetchBookingList = async (query: BookingQuery) => {
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "10", 10);
  const status = query.status ? query.status.split(",") : [];
  const search = query.search || "";
  const sortField = query.sortby || "createdAt";
  const sortOrder = query.orderby === "asc" ? 1 : -1;
  const startDate = query.startDate ? new Date(query.startDate) : null;
  const endDate = query.endDate ? new Date(query.endDate) : null;

  // Build $and conditions safely in a typed array
  const andConditions: NonNullable<PipelineStage.Match["$match"]["$and"]> = [
    {
      $or: [
        { bookingId: { $regex: search, $options: "i" } },
        { "user_info.phoneNumber": { $regex: search, $options: "i" } },
        { "technician_data.phoneNumber": { $regex: search, $options: "i" } },
        { "technician_data.name": { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
        { "user_info.name": { $regex: search, $options: "i" } },
        { "technician_data.status": { $regex: search, $options: "i" } },
      ],
    },
    {
      $or: [
        { status: { $in: status } },
        {
          $and: [
            { status: { $in: ["BOOKED", "IN_PROGRESS"] } },
            { $expr: { $eq: [status.length, 0] } },
          ],
        },
      ],
    },
  ];

  if (startDate && endDate) {
    andConditions.push({ date: { $gte: startDate, $lte: endDate } });
  } else if (startDate) {
    andConditions.push({ date: { $gte: startDate } });
  } else if (endDate) {
    andConditions.push({ date: { $lte: endDate } });
  }

  const matchConditions: PipelineStage.Match["$match"] = {
    $and: andConditions,
  };

  const offset = (page - 1) * limit;

  const basePipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "services",
        localField: "service_id",
        foreignField: "_id",
        as: "service_info",
      },
    },
    { $unwind: { path: "$service_info", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "technicians",
        localField: "assigned_to",
        foreignField: "_id",
        as: "technician_data",
      },
    },
    { $unwind: { path: "$technician_data", preserveNullAndEmptyArrays: true } },
    { $match: matchConditions },
  ];

  const bookings = await Booking.aggregate([
    ...basePipeline,
    { $sort: { [sortField]: sortOrder } },
    { $skip: offset },
    { $limit: limit },
    {
      $project: {
        address: 1,
        status: 1,
        createdAt: 1,
        updatedAt: 1,
        user: {
          id: { $ifNull: ["$user_info._id", ""] },
          name: { $ifNull: ["$user_info.name", ""] },
          phoneNumber: { $ifNull: ["$user_info.phoneNumber", ""] },
          createdAt: { $ifNull: ["$user_info.createdAt", null] },
        },
        service: {
          id: { $ifNull: ["$service_info._id", ""] },
          name: { $ifNull: ["$service_info.name", ""] },
        },
        technicianName: { $ifNull: ["$technician_data", {}] },
        date: 1,
        amount: { $toDouble: "$amount" },
        order_id: 1,
        bookingId: 1,
        slot: 1,
      },
    },
  ]);

  const totalBookings = await Booking.aggregate([
    ...basePipeline,
    { $count: "total" },
  ]);

  const totalCount = totalBookings.length ? totalBookings[0].total : 0;

  return {
    data: bookings,
    count: totalCount,
    pagination: {
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
};

export const userBookingListService = async (
  userId: string,
  page: number,
  limit: number,
  search: string,
  sortField: string,
  sortOrder: number,
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const offset = (page - 1) * limit;

  const matchStage = {
    $match: {
      user_id: new Types.ObjectId(userId),
    },
  };

  const searchMatch = {
    $match: {
      $or: [{ status: { $regex: search, $options: "i" } }],
    },
  };

  const lookupStages = [
    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "user_info",
      },
    },
    { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "services",
        localField: "service_id",
        foreignField: "_id",
        as: "service_info",
      },
    },
    { $unwind: { path: "$service_info", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "technicians",
        localField: "assigned_to",
        foreignField: "_id",
        as: "technician_data",
      },
    },
    { $unwind: { path: "$technician_data", preserveNullAndEmptyArrays: true } },
  ];

  // -------- Fetch paginated bookings ----------
  const bookings = await Booking.aggregate([
    matchStage,
    ...lookupStages,
    searchMatch,
    { $sort: { [sortField]: sortOrder as 1 | -1 } },
    { $skip: offset },
    { $limit: limit },
    {
      $project: {
        address: 1,
        status: 1,
        createdAt: 1,
        date: 1,
        amount: { $toDouble: "$amount" },
        order_id: 1,
        bookingId: 1,
        invoiceId: 1,
        invoiceUrl: 1,
        updatedAt: 1,
        slot: 1,
        user: {
          id: { $ifNull: ["$user_info._id", ""] },
          name: { $ifNull: ["$user_info.name", ""] },
          phoneNumber: { $ifNull: ["$user_info.phoneNumber", ""] },
          createdAt: { $ifNull: ["$user_info.createdAt", null] },
        },
        service: {
          id: { $ifNull: ["$service_info._id", ""] },
          name: { $ifNull: ["$service_info.name", ""] },
        },
        technician: { $ifNull: ["$technician_data", {}] },
      },
    },
  ]);

  // -------- Total Count (same filters but no pagination) ----------
  const totalResult = await Booking.aggregate([
    matchStage,
    ...lookupStages,
    searchMatch,
    { $count: "total" },
  ]);

  const totalCount = totalResult.length ? totalResult[0].total : 0;

  return {
    bookings,
    totalCount,
  };
};

// Service function to add order items to a booking
export const createOrderItem = async (
  bookingId: string,
  orderItems: IOrderItem[],
) => {
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new Error("Invalid booking ID");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const cleanedOrderItems = orderItems.map(({ _id, ...rest }) => rest);

  const totalAmount = cleanedOrderItems.reduce((total, item) => {
    const price = Number(item.price);
    const quantity = parseInt(item.quantity, 10);
    return total + price * quantity;
  }, 0);

  await Booking.updateOne(
    { _id: bookingId },
    {
      orderItems: cleanedOrderItems,
      amount: totalAmount,
    },
  );

  return { success: true };
};

// Service function to generate invoice for a booking
export const createInvoice = async (bookingId: string): Promise<void> => {
  if (!bookingId || bookingId.trim() === "") {
    throw new Error("Booking ID is required");
  }

  const booking = await Booking.findOne({ _id: new Types.ObjectId(bookingId) });
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Normalize order items (convert price to float)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizedOrderItems = (booking?.orderItems ?? []).map((item: any) => ({
    ...item.toObject(),
    price: Number(item.price.toString()),
  }));

  if (normalizedOrderItems.length === 0) {
    throw new Error("At least one order item is required");
  }

  // Calculate total amount
  const subtotal = calculateTotal(normalizedOrderItems);

  // Update booking with invoice details (mock invoice URL for now)
  await Booking.updateOne(
    { _id: bookingId },
    {
      $set: {
        status: "PAYMENT_PENDING",
        orderItems: normalizedOrderItems,
        invoiceUrl: `https://${process.env.S3_BUCKET_URL}/prod/sample.pdf`,
        amount: subtotal.toFixed(2),
      },
    },
  );

  // Send push notification to user
  const user = await User.findById(booking.user_id).select("deviceToken");
  if (user?.deviceToken && user.deviceToken.trim() !== "") {
    const registrationToken = user.deviceToken;
    const title = "Invoice Generated";
    const body = "Your invoice has been generated successfully.";

    await sendPushNotification(registrationToken, title, body);

    await Notification.create({
      userId: booking.user_id,
      text: "Your invoice has been generated successfully.",
    });
  }
};

// Service function to assign technician to a booking
export const technicianAssign = async (
  bookingId: string,
  technicianId: string,
): Promise<void> => {
  if (!bookingId || !technicianId) {
    throw new Error("Booking ID and Technician ID are required");
  }

  const booking = await Booking.findOne({ _id: new Types.ObjectId(bookingId) });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Update assigned technician and status
  await Booking.updateOne(
    { _id: booking._id },
    {
      assigned_to: new Types.ObjectId(technicianId),
      status: "TECHNICIAN_ASSIGNED",
    },
  );

  // Send push notification to user
  const user = await User.findById(booking.user_id).select("deviceToken");

  if (user?.deviceToken && user.deviceToken.trim() !== "") {
    const registrationToken = user.deviceToken;
    const title = "Technician Assigned";
    const body = "A technician has been assigned to your booking.";

    await sendPushNotification(registrationToken, title, body);

    await Notification.create({
      userId: booking.user_id,
      text: "A technician has been assigned to your booking.",
    });
  }
};

// Service function to manage booking status
const ALLOWED_STATUSES = [
  "ASSIGNMENT_PENDING",
  "TECHNICIAN_ASSIGNED",
  "PAYMENT_PENDING",
  "PAID",
  "IN_PROGRESS",
  "COMPLETE",
  "CANCELLED",
] as const;

export type BookingStatus = (typeof ALLOWED_STATUSES)[number];

export const updateBookingStatus = async (
  bookingId: string,
  status: BookingStatus,
): Promise<void> => {
  if (!bookingId || !status) {
    throw new Error("Booking ID and status are required");
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const booking = await Booking.findOne({ _id: new Types.ObjectId(bookingId) });
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Update booking status
  await Booking.updateOne({ _id: bookingId }, { status });

  // If booking is completed, free technician and notify user
  if (status === "COMPLETE" && booking.assigned_to) {
    await Technician.updateOne(
      { _id: new Types.ObjectId(booking.assigned_to) },
      { status: "AVAILABLE" },
    );

    const user = await User.findById(booking.user_id).select("deviceToken");

    if (user?.deviceToken && user.deviceToken.trim() !== "") {
      const title = "Booking Completed";
      const body = "Your booking has been completed successfully.";

      await sendPushNotification(user.deviceToken, title, body);

      await Notification.create({
        userId: booking.user_id,
        text: body,
      });
    }
  }
};

export const mobileBookingListService = async (
  userId: string,
  page: number,
  limit: number,
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new Error("INVALID_USER_ID");
  }

  const pageNumber = Number(page) || 1;
  const pageSize = Number(limit) || 10;
  const skip = (pageNumber - 1) * pageSize;

  const bookings = await Booking.aggregate([
    { $match: { user_id: new Types.ObjectId(userId) } },

    {
      $lookup: {
        from: "users",
        localField: "user_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    { $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true } },

    { $unwind: { path: "$serviceDetails", preserveNullAndEmptyArrays: true } },

    {
      $lookup: {
        from: "services",
        localField: "serviceDetails.service_id",
        foreignField: "_id",
        as: "serviceDetails.serviceData",
      },
    },
    {
      $unwind: {
        path: "$serviceDetails.serviceData",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $group: {
        _id: {
          bookingId: "$_id",
          service_id: "$serviceDetails.service_id",
        },
        bookingId: { $first: "$bookingId" },
        invoiceId: { $first: "$invoiceId" },
        status: { $first: "$status" },
        date: { $first: "$date" },
        amount: { $first: "$amount" },
        createdAt: { $first: "$createdAt" },
      },
    },

    {
      $group: {
        _id: "$_id.bookingId",
        bookingId: { $first: "$bookingId" },
        status: { $first: "$status" },
        date: { $first: "$date" },
        createdAt: { $first: "$createdAt" },
      },
    },

    {
      $project: {
        _id: 1,
        bookingId: 1,
        status: 1,
        date: 1,
        createdAt: 1,
      },
    },

    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: pageSize },
  ]);

  const totalCountPipeline = [
    { $match: { user_id: new Types.ObjectId(userId) } },
    { $count: "totalCount" },
  ];

  const totalCountResult = await Booking.aggregate(totalCountPipeline);
  const total = totalCountResult[0]?.totalCount || 0;

  return {
    data: bookings,
    total,
  };
};

export const mobileBookingDetailsService = async (bookingId: string) => {
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new Error("INVALID_BOOKING_ID");
  }

  const details = await Booking.aggregate([
    { $match: { _id: new Types.ObjectId(bookingId) } },
    { $unwind: { path: "$serviceDetails", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "services",
        localField: "serviceDetails.service_id",
        foreignField: "_id",
        as: "serviceDetails.serviceData",
      },
    },
    {
      $unwind: {
        path: "$serviceDetails.serviceData",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "technicians",
        localField: "assigned_to",
        foreignField: "_id",
        as: "technician_data",
      },
    },
    { $unwind: { path: "$technician_data", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: {
          bookingId: "$_id",
          date: "$date",
          status: "$status",
          slot: "$slot",
          invoiceUrl: "$invoiceUrl",
          addressDetails: "$addressDetails",
          order_id: "$order_id",
          couponDetails: "$couponDetails",
          technician_data: "$technician_data",
          service_id: "$serviceDetails.service_id",
          service_name: "$serviceDetails.serviceData.name",
        },
        technician_data: { $first: "$technician_data" },
        addressDetails: { $first: "$addressDetails" },
        bookingId: { $first: "$bookingId" },
        order_id: { $first: "$order_id" },
        couponDetails: { $first: "$couponDetails" },
        invoiceUrl: { $first: "$invoiceUrl" },
        status: { $first: "$status" },
        date: { $first: "$date" },
        slot: { $first: "$slot" },
        amount: { $first: "$amount" },
        isCouponApply: { $first: "$isCouponApply" },
        serviceDetails: {
          $push: {
            serviceType: "$serviceDetails.serviceType",
            quantity: "$serviceDetails.quantity",
            acType: "$serviceDetails.acType",
            otherService: { $ifNull: ["$serviceDetails.otherService", ""] },
            place: "$serviceDetails.place",
            comment: "$serviceDetails.comment",
            services: "$serviceDetails.services",
            service_name: "$serviceDetails.serviceData.name",
          },
        },
      },
    },
    {
      $group: {
        _id: "$_id.bookingId",
        bookingId: { $first: "$bookingId" },
        status: { $first: "$status" },
        amount: { $first: "$amount" },
        isCouponApply: { $first: "$isCouponApply" },
        date: { $first: "$date" },
        invoiceUrl: { $first: "$invoiceUrl" },
        addressDetails: { $first: "$addressDetails" },
        order_id: { $first: "$order_id" },
        couponDetails: { $first: "$couponDetails" },
        technician_data: { $first: "$technician_data" },
        slot: { $first: "$slot" },
        serviceDetails: {
          $push: {
            service_name: "$_id.service_name",
            service_id: "$_id.service_id",
            as_details: "$serviceDetails",
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        bookingId: 1,
        status: { $ifNull: ["$status", ""] },
        date: { $ifNull: ["$date", ""] },
        amount: { $ifNull: [{ $toDouble: "$amount" }, 0] },
        isCouponApply: { $ifNull: ["$isCouponApply", "2"] },
        invoiceUrl: { $ifNull: ["$invoiceUrl", ""] },
        addressDetails: { $ifNull: ["$addressDetails", ""] },
        order_id: { $ifNull: ["$order_id", ""] },
        couponDetails: { $ifNull: ["$couponDetails", {}] },
        technician_data: {
          _id: 1,
          name: 1,
          phoneNumber: 1,
        },
        slot: { $ifNull: ["$slot", ""] },
        serviceDetails: 1,
      },
    },
  ]);

  if (!details || details.length === 0) {
    throw new Error("BOOKING_NOT_FOUND");
  }

  const result = details[0];
  if (!result.technician_data) {
    result.technician_data = {};
  }

  return result;
};

export const mobileBookingSummaryService = async (bookingId: string) => {
  if (!Types.ObjectId.isValid(bookingId)) {
    throw new Error("INVALID_BOOKING_ID");
  }

  // Fetch coupon + discount summary
  const summary = await Booking.aggregate([
    {
      $match: { _id: new Types.ObjectId(bookingId) },
    },
    {
      $project: {
        originalTotal: { $ifNull: ["$originalTotal", ""] },
        discountAmount: { $ifNull: ["$discountAmount", ""] },
        discountedTotal: { $ifNull: ["$discountedTotal", ""] },
        couponDetails: { $ifNull: ["$couponDetails", {}] },
        isCouponApply: { $ifNull: ["$isCouponApply", 0] },
        discount: { $ifNull: ["$discount", ""] },
        _id: 0,
      },
    },
  ]);

  const summaryData = summary.length ? summary[0] : {};

  // Fetch order items for calculating total amount
  const items = await Booking.aggregate([
    { $match: { _id: new Types.ObjectId(bookingId) } },
    { $unwind: "$orderItems" },
    {
      $project: {
        _id: "$orderItems._id",
        item: "$orderItems.item",
        quantity: "$orderItems.quantity",
        price: { $toDouble: "$orderItems.price" },
      },
    },
  ]);

  // Total calculation
  const totalPrice = calculateTotal(items);

  return {
    orderItem: items,
    totalPrice,
    ...summaryData,
  };
};
