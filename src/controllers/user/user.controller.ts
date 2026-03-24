import { IUser } from "../../models/user/user.model";
import * as userService from "../../services/user/user.service";
import { Request, Response } from "express";

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { countryCode, phoneNumber } = req.body;

    if (!countryCode || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Country code and phone number are required.",
      });
    }

    const user = await userService.createUser(countryCode, phoneNumber);

    return res.status(201).json({
      success: true,
      message: "OTP sent for verification",
      userId: Object(user._id),
    });
  } catch (err: unknown) {
    return res.status(409).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const loginRegisterUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { countryCode, phoneNumber } = req.body;

    if (!countryCode || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Country code and phone number are required.",
      });
    }

    const user: IUser | null = await userService.loginUser(
      countryCode,
      phoneNumber,
    );

    if (!user) {
      const newUser: IUser = await userService.createUser(
        countryCode,
        phoneNumber,
      );

      return res.status(201).json({
        success: true,
        message: "OTP sent for verification.",
        userId: newUser._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent for login.",
      userId: user._id,
    });
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: errorMessage,
    });
  }
};

// GET USER BY ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    const user = await userService.getUserById(id);
    return res.json({ success: true, data: user });
  } catch (err) {
    return res.status(404).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// UPDATE USER
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    const user = await userService.updateUser(id, req.body);
    return res.json({ success: true, message: "User updated", data: user });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// DELETE USER
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "User ID is required" });
    }

    await userService.deleteUser(id);
    return res.json({ success: true, message: "User deleted" });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const userAddresses = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const addresses = await userService.getUserAddresses(userId);

    if (!addresses.length) {
      return res.status(404).json({
        success: false,
        message: "No addresses found for this user",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      data: addresses,
      count: addresses.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching user addresses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const userActiveAddresses = async (req: Request, res: Response) => {
  try {
    // const { userId } = req.params;
    const userId = (req as unknown as { userId: string }).userId;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const addresses = await userService.getUserActiveAddresses(userId);

    if (!addresses.length) {
      return res.status(404).json({
        success: false,
        message: "No addresses found for this user",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Addresses fetched successfully",
      data: addresses,
      count: addresses.length,
    });
  } catch (error: unknown) {
    console.error("Error fetching user addresses:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const activeInactiveUser = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const updatedUser: IUser | null =
      await userService.toggleUserActiveStatus(userId);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        updatedUser.isActive === true
          ? "User account activated successfully"
          : "User account deactivated successfully",
      data: updatedUser,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";
    const status = message === "User not found" ? 404 : 500;

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

export const userList = async (req: Request, res: Response) => {
  try {
    const {
      page = "1",
      limit = "10",
      search = "",
      sortby = "createdAt",
      orderby = "desc",
      startDate,
      endDate,
    } = req.query;

    const { users, total, pagination } = await userService.getUserList({
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
      search: search as string,
      sortField: sortby as string,
      sortOrder: (orderby as string) === "desc" ? "desc" : "asc",
      startDate: startDate as string,
      endDate: endDate as string,
    });

    if (!users.length) {
      return res.status(404).json({
        success: false,
        message: "No users found",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: users,
      count: total,
      pagination,
    });
  } catch (error: unknown) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export const addEditAddress = async (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { addressId } = req.body;

  const {
    // addressId,
    // userId,
    houseNumber,
    street,
    state,
    city,
    zipCode,
    landmark,
    saveAs,
  } = req.body;

  if (!userId || !houseNumber || !street || !state || !city || !zipCode) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  try {
    const result = await userService.addEditAddressService(addressId || null, {
      userId,
      houseNumber,
      street,
      state,
      city,
      zipCode,
      landmark,
      saveAs,
    });

    return res.status(200).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: unknown) {
    let status = 500;
    let message = "Something went wrong";

    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      "message" in error
    ) {
      status = (error as { statusCode: number }).statusCode;
      message = (error as { message: string }).message;
    }

    return res.status(status).json({
      success: false,
      message,
    });
  }
};

export const deleteUserAddress = async (req: Request, res: Response) => {
  const userId = (req as unknown as { userId: string }).userId;
  const { addressId } = req.params;

  if (!addressId) {
    return res
      .status(400)
      .json({ success: false, error: "Address ID is required" });
  }

  try {
    const result = await userService.deleteUserAddressService(
      userId,
      addressId,
    );

    return res.status(result.statusCode).json({
      success: result.statusCode === 200,
      message: result.message,
    });
  } catch (error: unknown) {
    let message = "Internal server error";

    if (error instanceof Error) {
      message = error.message;
    }

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const getUserHomeScreenList = (req: Request, res: Response) => {
  try {
    const data = userService.getUserHomeScreenListService();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    let message = "Something went wrong";

    if (error instanceof Error) {
      message = error.message;
    }

    console.error("Home Screen Error:", message);

    return res.status(500).json({
      success: false,
      message,
    });
  }
};
