import { Booking } from "../../models/booking/booking.model";
import Coupon, { ICoupon } from "../../models/coupon/coupon.model";
import { Types, SortOrder } from "mongoose";

interface ApplyCouponInput {
  couponCode: string;
  userId: string;
  bookingId: string;
  amount: number;
  isApply: number;
}

export const createCouponService = async (payload: {
  couponCode: string | null;
  image?: string;
  name: string;
  discount: number;
  minValue: number;
  expiryDate: Date;
  description: string[];
}): Promise<ICoupon> => {
  const { couponCode } = payload;
  const existingCoupon = await Coupon.findOne({ couponCode });

  if (existingCoupon) {
    throw new Error("Coupon code already exists");
  }

  const newCoupon = await Coupon.create(payload);
  return newCoupon;
};

export const updateCouponService = async (
  couponId: string,
  payload: Partial<ICoupon>,
): Promise<ICoupon | null> => {
  if (!Types.ObjectId.isValid(couponId)) {
    throw new Error("Invalid coupon ID");
  }

  const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, payload, {
    new: true,
  });

  return updatedCoupon;
};

export const couponListService = async (
  page: number,
  limit: number,
  search: string,
  sortField: string,
  sortOrder: SortOrder,
): Promise<{
  data: ICoupon[];
  count: number;
}> => {
  const offset = (page - 1) * limit;

  const query = {
    $or: [
      { couponCode: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
    ],
  };

  const data = await Coupon.find(query)
    .skip(offset)
    .limit(limit)
    .sort({ [sortField]: sortOrder });

  const count = await Coupon.countDocuments(query);

  return { data, count };
};

export const getCouponByIdService = async (
  couponId: unknown,
): Promise<ICoupon | null> => {
  // Validate ObjectId
  if (typeof couponId !== "string" || !Types.ObjectId.isValid(couponId)) {
    throw new Error("INVALID_ID");
  }

  const coupon = await Coupon.findById(couponId).lean<ICoupon>().exec();
  return coupon;
};

export const toggleCouponStatusService = async (
  couponId: string,
): Promise<{ updated: boolean; coupon?: ICoupon | null; message: string }> => {
  if (!Types.ObjectId.isValid(couponId)) {
    throw new Error("INVALID_ID");
  }

  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    return {
      updated: false,
      coupon: null,
      message: "Coupon not found",
    };
  }

  const newStatus = coupon.isActive ? false : true;

  await Coupon.updateOne(
    { _id: new Types.ObjectId(couponId) },
    { isActive: newStatus },
  );

  const updatedCoupon = await Coupon.findById(couponId);

  return {
    updated: true,
    coupon: updatedCoupon!,
    message: newStatus ? "Coupon activated" : "Coupon de-activated",
  };
};

export const applyCouponCodeService = async (body: unknown) => {
  const { couponCode, userId, bookingId, amount, isApply } =
    body as ApplyCouponInput;

  if (!couponCode || !userId || !bookingId || !isApply) {
    return {
      status: false,
      message: "Coupon code, user ID, and booking ID are required.",
    };
  }

  // Validate MongoID
  if (!Types.ObjectId.isValid(bookingId)) {
    return {
      status: false,
      message: "Invalid booking ID.",
    };
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return { status: false, message: "Booking not found." };
  }

  const coupon = await Coupon.findOne({ couponCode, isActive: true });
  if (!coupon) {
    return { status: false, message: "Invalid or inactive coupon code." };
  }

  // Expiry check
  if (new Date(coupon.expiryDate) < new Date()) {
    return { status: false, message: "This coupon has expired." };
  }

  // Minimum value check
  if (amount < coupon.minValue) {
    return {
      status: false,
      message: `Minimum order value is ${coupon.minValue}.`,
    };
  }

  const discountAmount = (amount * coupon.discount) / 100;
  const discountedTotal = amount - discountAmount;

  if (isApply === 1) {
    await Booking.updateOne(
      { _id: bookingId },
      {
        originalTotal: amount,
        discountAmount,
        discountedTotal,
        discount: coupon.discount,
        isCouponApply: 1,
        couponDetails: coupon,
      },
    );
  } else {
    await Booking.updateOne(
      { _id: bookingId },
      {
        originalTotal: "",
        discountAmount: "",
        discountedTotal: "",
        discount: "",
        isCouponApply: 2,
        couponDetails: {},
      },
    );
  }

  return {
    status: true,
    message: "Coupon applied successfully.",
    data: {
      originalTotal: amount,
      discountAmount,
      discountedTotal,
    },
  };
};
