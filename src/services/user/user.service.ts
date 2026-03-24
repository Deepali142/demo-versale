import User from "../../models/user/user.model";
import * as otpService from "../user/otp.service";
import { IUser } from "../../models/user/user.model";
import mongoose, { Types } from "mongoose";
import Address, { IAddress } from "../../models/user/address.model";

interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}

export const createUser = async (countryCode: string, phoneNumber: string) => {
  phoneNumber = phoneNumber.trim();

  // Check if already exists
  const user = await User.findOne({ countryCode, phoneNumber });
  if (user) throw new Error("User already registered");

  const newUser = new User({
    countryCode,
    phoneNumber,
    status: "pending",
    role: "user",
  });
  await newUser.save();

  // Create new user with "pending" status
  const fullPhone = countryCode.startsWith("+")
    ? `${countryCode}${phoneNumber}`
    : `+${countryCode}${phoneNumber}`;

  // Send OTP
  await otpService.createOtp(String(newUser._id), fullPhone);

  return newUser;
};

export const loginUser = async (countryCode: string, phoneNumber: string) => {
  phoneNumber = phoneNumber.trim();

  const user = await User.findOne({ countryCode, phoneNumber });
  if (!user) throw new Error("user not found");

  const fullPhone = user.countryCode?.startsWith("+")
    ? `${user.countryCode}${user.phoneNumber}`
    : `+${user.countryCode}${user.phoneNumber}`;

  await otpService.createOtp(String(user._id), fullPhone);

  return user;
};

// GET USER BY ID
export const getUserById = async (id: string) => {
  const user = await User.findById(id);
  if (!user) throw new Error("User not found");
  return user;
};

// UPDATE USER
export const updateUser = async (id: string, updateData: Partial<IUser>) => {
  const user = await User.findByIdAndUpdate(id, updateData, { new: true });
  if (!user) throw new Error("User not found or update failed");
  return user;
};

// DELETE USER
export const deleteUser = async (id: string) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found or already deleted");
  return user;
};

export const getUserAddresses = async (userId: string) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid or missing userId");
  }

  const addresses = await Address.find({ userId }).lean();

  if (!addresses || addresses.length === 0) {
    throw new Error("No addresses found for this user");
  }

  return addresses;
};

export const getUserActiveAddresses = async (userId: string) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error("Invalid or missing userId");
  }

  const user = await User.findOne({ _id: new Types.ObjectId(userId) });

  if (!user) {
    throw new Error("User not found");
  }

  const addresses = await Address.find({ userId, isActive: true })
    .sort({ createdAt: -1 })
    .lean();

  if (!addresses || addresses.length === 0) {
    throw new Error("No addresses found for this user");
  }

  return addresses;
};

export const toggleUserActiveStatus = async (userId: string) => {
  if (!userId) throw new Error("User ID is required");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const updatedUser = await User.findOneAndUpdate(
    { _id: new Types.ObjectId(userId) },
    { isActive: user.isActive === true ? false : true },
    { new: true },
  );

  return updatedUser;
};

export const getUserList = async ({
  page = 1,
  limit = 10,
  search = "",
  sortField = "createdAt",
  sortOrder = "desc",
  startDate,
  endDate,
}: UserListParams) => {
  const skip = (page - 1) * limit;
  const sort = { [sortField]: sortOrder === "desc" ? -1 : 1 };

  const matchConditions: Record<string, unknown> = {};

  // Search filter
  if (search) {
    matchConditions.$or = [
      { phoneNumber: { $regex: search, $options: "i" } },
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  // Date filters
  if (startDate && endDate) {
    matchConditions.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    matchConditions.createdAt = { $gte: new Date(startDate) };
  } else if (endDate) {
    matchConditions.createdAt = { $lte: new Date(endDate) };
  }

  // Query aggregation
  const users = await User.aggregate([
    { $match: matchConditions },
    {
      $project: {
        name: { $ifNull: ["$name", ""] },
        phoneNumber: { $ifNull: ["$phoneNumber", ""] },
        countryCode: { $ifNull: ["$countryCode", ""] },
        isActive: { $ifNull: ["$isActive", false] },
        isOtpVerify: { $ifNull: ["$isOtpVerify", false] },
        createdAt: { $ifNull: ["$createdAt", ""] },
        type: { $ifNull: ["$type", "NA"] },
        email: { $ifNull: ["$email", ""] },
      },
    },
    { $sort: sort as Record<string, 1 | -1> },
    { $skip: skip },
    { $limit: limit },
  ]);

  const total = await User.countDocuments(matchConditions);

  return {
    users,
    total,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const addEditAddressService = async (
  addressId: string | null,
  payload: {
    userId: string;
    houseNumber?: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    landmark?: string;
    saveAs?: string;
  },
): Promise<{ message: string; data: IAddress }> => {
  const {
    userId,
    houseNumber,
    street,
    city,
    state,
    zipCode,
    landmark,
    saveAs,
  } = payload;

  // Create new address
  if (!addressId) {
    const createdAddress = await Address.create({
      userId: new mongoose.Types.ObjectId(userId),
      house: houseNumber,
      street,
      state,
      city,
      zipcode: zipCode,
      saveAs: saveAs || "",
      landmark: landmark || "",
    });

    return {
      message: "Address created successfully",
      data: createdAddress,
    };
  }

  // Update
  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    {
      userId: new mongoose.Types.ObjectId(userId),
      house: houseNumber,
      street,
      state,
      city,
      zipcode: zipCode,
      saveAs: saveAs || "",
      landmark: landmark || "",
    },
    { new: true },
  );

  if (!updatedAddress) {
    throw {
      statusCode: 404,
      message: "Address not found",
    };
  }

  return {
    message: "Address updated successfully",
    data: updatedAddress,
  };
};

export const deleteUserAddressService = async (
  userId: string,
  addressId: string,
) => {
  if (!mongoose.Types.ObjectId.isValid(addressId)) {
    return {
      statusCode: 400,
      message: "Invalid address ID",
    };
  }

  const address = await Address.findOne({
    _id: addressId,
    userId,
    isActive: true,
  });

  if (!address) {
    return {
      statusCode: 404,
      message: "Address not found or not associated with this user",
    };
  }

  await Address.updateOne({ _id: addressId }, { isActive: false });

  return {
    statusCode: 200,
    message: "Address deleted successfully",
  };
};

export const getUserHomeScreenListService = () => {
  // Static home screen data (can later be fetched from DB)
  const data = [
    {
      logo: "https://service.com/prod/homescreen/homebanner.png",
    },
  ];

  return data;
};
