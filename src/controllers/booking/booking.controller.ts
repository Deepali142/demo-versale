import { Request, Response } from "express";
import {
  createBooking,
  updateBooking,
  fetchBookingById,
  fetchBookingList,
  createOrderItem,
  createInvoice,
  technicianAssign,
  updateBookingStatus,
  mobileBookingListService,
  mobileBookingDetailsService,
  mobileBookingSummaryService,
  userBookingListService,
} from "../../services/booking/booking.service";
// import { Booking } from "../../models/booking/booking.model";

// Controller to add a new booking
export const addBookingController = async (req: Request, res: Response) => {
  try {
    const booking = await createBooking(req.body);

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: booking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal server error",
    });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  if (!bookingId?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Booking ID is required",
    });
  }

  try {
    const booking = await fetchBookingById(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const editBooking = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { bookingId } = req.params;
    const { serviceDetails, addressId, slot, date, amount } = req.body;

    // Basic validation before service call
    if (!bookingId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }
    if (!addressId?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required",
      });
    }
    if (!slot?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Slot is required",
      });
    }

    const updatedBooking = await updateBooking({
      bookingId,
      serviceDetails,
      addressId,
      slot,
      date,
      amount,
    });

    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Booking updated successfully",
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Internal Server Error",
    });
  }
};

// Controller to get list of bookings with filters, pagination, and sorting
// This controller not working as of now gives this error
// {
//     "success": false,
//     "message": "Internal server error",
//     "error": "input must be a 24 character hex string, 12 byte Uint8Array, or an integer"
// }

export const bookingList = async (req: Request, res: Response) => {
  console.log("booking list req.query:", req.query);
  console.log("typeof status:", typeof req.query.status, req.query.status);

  // console.log("entered into the booking list controller", req.query)
  try {
    const result = await fetchBookingList(req.query);

    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: result.data,
      count: result.count,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    console.error("Error fetching booking list:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Controller to get list of bookings with filters, pagination, and sorting
export const ListOfBooking = async (req: Request, res: Response) => {
  console.log("booking req.query:", req.query);
  console.log("typeof status:", typeof req.query.status, req.query.status);

  try {
    const result = await fetchBookingList(req.query);
    return res.status(200).json({
      success: true,
      message: "Bookings fetched successfully",
      data: result.data,
      count: result.count,
      pagination: result.pagination,
    });
  } catch (error: unknown) {
    console.error("Error fetching booking list:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

interface UserQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortby?: string;
  orderby?: "asc" | "desc";
}

export const userBookingList = async (req: Request, res: Response) => {
  try {
    // const query = req.query as unknown;

    const query = req.query as UserQuery;

    const page = parseInt(query.page ?? "1");
    const limit = parseInt(query.limit ?? "10");
    const search = query.search ?? "";

    const sortField = query.sortby ?? "createdAt";
    const sortOrder = query.orderby === "desc" ? -1 : 1;

    const userId = req.params.userId;

    if (!userId) {
      return res.status(200).json({
        status: false,
        message: "User ID is required",
      });
    }

    const { bookings, totalCount } = await userBookingListService(
      userId,
      page,
      limit,
      search,
      sortField,
      sortOrder,
    );

    return res.status(200).json({
      status: true,
      data: bookings,
      count: totalCount,
      pagination: {
        totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("Error fetching user booking list:", err.message);

    return res.status(500).json({
      status: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

// Controller to add order items to a booking
export const addOrderItem = async (req: Request, res: Response) => {
  try {
    const { bookingId, orderItems } = req.body;

    if (!bookingId?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Booking ID is required" });
    }

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Order items are required" });
    }

    await createOrderItem(bookingId, orderItems);

    return res
      .status(200)
      .json({ success: true, message: "Order items added successfully" });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === "Invalid booking ID") {
        return res.status(400).json({ success: false, message: error.message });
      }

      if (error.message === "Booking not found") {
        return res.status(404).json({ success: false, message: error.message });
      }

      return res.status(500).json({ success: false, message: error.message });
    }

    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// Controller to generate invoice for a booking invoice
export const generateInvoice = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { bookingId } = req.params;

    if (bookingId) await createInvoice(bookingId);
    // await createInvoice(bookingId);

    return res.status(200).json({
      success: true,
      message: "Invoice generated successfully",
    });
  } catch (error: unknown) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Something went wrong while generating the invoice",
    });
  }
};

// Controller to assign technician to a booking
export const assignTechnician = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { bookingId, technicianId } = req.body;

    await technicianAssign(bookingId, technicianId);

    return res.status(200).json({
      success: true,
      message: "Technician assigned successfully",
    });
  } catch (error: unknown) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to assign technician",
    });
  }
};

// Controller to manage booking status
export const manageBookingStatus = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { bookingId, status } = req.body;

    await updateBookingStatus(bookingId, status);

    return res.status(200).json({
      success: true,
      message: "Booking status updated successfully",
    });
  } catch (error: unknown) {
    const statusCode =
      error instanceof Error &&
      (error.message === "Booking not found" ||
        error.message.includes("Invalid") ||
        error.message.includes("required"))
        ? 400
        : 500;

    return res.status(statusCode).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update booking status",
    });
  }
};

export const mobileBookingList = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown;
    // const params = req.params as unknown;

    const { page = 1, limit = 10 } = query as {
      page?: number | string;
      limit?: number | string;
    };
    // const { userId } = params as { userId: string };
    const userId = (req as unknown as { userId: string }).userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const result = await mobileBookingListService(
      userId,
      Number(page),
      Number(limit),
    );

    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error: unknown) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const mobileBookingDetails = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.params as unknown as { bookingId: string };

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID is required",
      });
    }

    const data = await mobileBookingDetailsService(bookingId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    return res.status(500).json({
      success: false,
      message,
    });
  }
};

export const mobileBookingSummary = async (req: Request, res: Response) => {
  try {
    const params = req.params as unknown;
    const { bookingId } = params as { bookingId: string };

    if (!bookingId) {
      return res.status(200).json({
        success: false,
        message: "Booking id is required",
      });
    }

    const result = await mobileBookingSummaryService(bookingId);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
