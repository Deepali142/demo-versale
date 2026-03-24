import { Request, Response } from "express";
import * as technicianService from "../../services/technician/technician.service";
import { ITechnician } from "../../models/technician/technician.model";
import mongoose from "mongoose";

export interface UpdateKycDTO {
  type:
    | "PAN"
    | "AADHAR_FRONT"
    | "AADHAR_BACK"
    | "DRIVING_LICENSE"
    | "VOTER_ID"
    | "PASSPORT";
  comment?: string;
  docUrl: string;
}

interface AuthenticatedRequest extends Request {
  technicianId?: string; // coming from your auth middleware
}

export const registerTechnician = async (req: Request, res: Response) => {
  try {
    await technicianService.createTechnician(req.body);

    return res.status(201).json({
      success: true,
      message: "Technician created successfully",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message.includes(
        "A technician with the given phone number already exists",
      )
    ) {
      return res.status(409).json({
        success: false,
        message,
      });
    }

    console.error("Error creating technician:", message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: message,
    });
  }
};

export const loginRegisterTechnician = async (req: Request, res: Response) => {
  try {
    const { countryCode, phoneNumber } = req.body;

    if (!countryCode || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Country code and phone number are required.",
      });
    }

    const technician: ITechnician | null =
      await technicianService.loginTechnician(countryCode, phoneNumber);

    if (!technician) {
      const newTechnician: ITechnician | null =
        await technicianService.createTechnician(req.body);

      return res.status(201).json({
        success: true,
        message:
          "Technician registered successfully. OTP sent for verification.",
        technicianId: newTechnician?._id,
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent for login.",
      technicianId: technician._id,
    });
  } catch (err: unknown) {
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

// Not required will remove later
// export const getTechnicianById = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     if (!id) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Technician ID is required" });
//     }

//     const technician = await technicianService.getTechnicianById(id);
//     res.status(200).json({
//       success: true,
//       data: technician,
//       message: "Technician fetched successfully",
//     });
//   } catch (err: unknown) {
//     res.status(404).json({
//       success: false,
//       error: err instanceof Error ? err.message : String(err),
//     });
//   }
// };

export const getTechnicianById = async (req: Request, res: Response) => {
  const { technicianId } = req.params;

  // Validate ID
  if (!technicianId || technicianId.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Technician ID is required",
    });
  }

  if (!mongoose.Types.ObjectId.isValid(technicianId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid technician ID format",
    });
  }

  try {
    const technician =
      await technicianService.getTechnicianByIdService(technicianId);

    return res.status(200).json({
      success: true,
      data: technician,
    });
  } catch (err) {
    const message = (err as Error).message;

    if (message === "Technician not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    // fallback
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: message,
    });
  }
};

// export const getAllTechnicians = async (_req: Request, res: Response) => {
//   try {
//     const technicians = await technicianService.getAllTechnicians();
//     res.json({ success: true, data: technicians });
//   } catch (err: unknown) {
//     res.status(500).json({
//       success: false,
//       error: err instanceof Error ? err.message : String(err),
//     });
//   }
// };

// export const updateTechnician = async (req: Request, res: Response) => {
//   try {
//     const { id } = req.params;
//     if (!id) {
//       return res
//         .status(400)
//         .json({ success: false, error: "Technician ID is required" });
//     }

//     const updatedTechnician = await technicianService.updateTechnicianById(
//       id,
//       req.body,
//     );
//     res.json({
//       success: true,
//       message: "Technician updated successfully",
//       data: updatedTechnician,
//     });
//   } catch (err: unknown) {
//     res.status(400).json({
//       success: false,
//       error: err instanceof Error ? err.message : String(err),
//     });
//   }
// };

export const editTechnician = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.params;

    if (!technicianId) {
      return res
        .status(400)
        .json({ success: false, error: "Technician ID is required" });
    }

    const result = await technicianService.updateTechnicianService(
      technicianId,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Technician updated successfully",
      data: result,
    });
  } catch (err) {
    const message = (err as Error).message;

    if (message === "Technician not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    // fallback
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: message,
    });
  }
};

export const updateProfessionalSkills = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.params;

    if (!technicianId || !mongoose.Types.ObjectId.isValid(technicianId)) {
      return res.status(400).json({
        success: false,
        message: "Valid technician ID is required",
      });
    }

    const { professionalSkills } = req.body;

    const updatedTech = await technicianService.updateProfessionalSkillsService(
      technicianId,
      professionalSkills,
    );

    return res.status(200).json({
      success: true,
      message: "Professional skills updated successfully",
      data: updatedTech,
    });
  } catch (err) {
    const message = (err as Error).message;

    if (message === "Technician not found") {
      return res.status(404).json({
        success: false,
        message,
      });
    }

    // fallback
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: message,
    });
  }
};

export const deleteTechnician = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, error: "Technician ID is required" });
    }

    await technicianService.deleteTechnicianById(id);
    res.json({ success: true, message: "Technician deleted successfully" });
  } catch (err: unknown) {
    res.status(404).json({
      success: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
};

export const updateKyc = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const technicianId =
      (req as { technicianId?: string }).technicianId ||
      req.params.technicianId;
    const { type, docUrl } = req.body as UpdateKycDTO;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: "Technician ID is required",
      });
    }

    const uploadedBy = (req as { technicianId?: string }).technicianId
      ? "technician"
      : "admin";

    await technicianService.updateKycService(
      technicianId,
      type,
      docUrl,
      uploadedBy,
    );

    return res.status(200).json({
      success: true,
      message: "Technician KYC updated successfully",
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === "Technician not found") {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return res.status(500).json({
      success: false,
      message:
        (err instanceof Error && err.message) ||
        "falseed to update technician KYC",
    });
  }
};

export const updateKycStatus = async (req: Request, res: Response) => {
  const { technicianId, action } = req.body;

  try {
    const result = await technicianService.updateKycStatusService({
      technicianId,
      action: action.toUpperCase(),
    });

    return res.status(result.statusCode).json({
      success: result.success,
      message: result.message,
      data: result.data || null,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }

    // fallback if error is not instance of Error
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: String(error),
    });
  }
};

export const toggleTechnicianStatus = async (req: Request, res: Response) => {
  const { technicianId } = req.params as { technicianId: string };

  try {
    const updatedTechnician =
      await technicianService.toggleTechnicianStatusService(technicianId);

    if (!updatedTechnician) {
      return res.status(404).json({
        success: false,
        message: "Technician not found",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Technician status updated to ${updatedTechnician.status}`,
      data: updatedTechnician,
    });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: errMsg,
      data: null,
    });
  }
};

export const getKyc = async (req: Request, res: Response) => {
  try {
    const technicianId = (req as unknown as { technicianId: string })
      .technicianId;

    const kycDocs = await technicianService.getKycService(technicianId);

    return res.status(200).json({
      success: true,
      data: kycDocs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Internal server error",
    });
  }
};

export const createKycReviewRequest = async (req: Request, res: Response) => {
  try {
    const technicianId = (req as unknown as { technicianId: string })
      .technicianId;

    const result = await technicianService.createKycReviewRequestService(
      technicianId!,
    );

    return res.status(200).json({
      success: true,
      message: "KYC review request submitted successfully",
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: (error as Error).message || "Internal server error",
    });
  }
};

export const markAttendance = async (req: Request, res: Response) => {
  try {
    const technicianId = (req as unknown as { technicianId: string })
      .technicianId;

    const { date, type, description } = req.body;

    const record = await technicianService.markAttendanceService({
      technicianId,
      date,
      type,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Attendance marked successfully",
      data: record,
    });
  } catch (error: unknown) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (error as Error).message,
    });
  }
};

export const getAttendanceDataForDateRange = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  const technicianId = req.technicianId;
  const { startDate, endDate } = req.query;

  if (!technicianId) {
    return res.status(400).json({
      success: false,
      message: "Technician ID is missing from auth token",
    });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({
      success: false,
      message: "Start date and end date are required",
    });
  }

  try {
    const data = await technicianService.getAttendanceDataForDateRangeService(
      technicianId,
      startDate as string,
      endDate as string,
    );

    return res.status(200).json({
      success: true,
      message: "Attendance data fetched successfully",
      data,
    });
  } catch (error: unknown) {
    // SAFE ERROR HANDLING
    let errorMessage = "Something went wrong";
    // let statusCode = 500;

    if (error instanceof Error) {
      errorMessage = error.message;
      // Optional: custom error classes for better mapping
      // if ((error as any).statusCode) {
      //   statusCode = (error as any).statusCode;
      // }
    }

    console.error("Attendance Error:", errorMessage);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: errorMessage,
    });
  }
};

export const applyLeave = async (req: Request, res: Response) => {
  const technicianId = (req as unknown as { technicianId: string })
    .technicianId;
  const { date, reason, type } = req.body;

  try {
    const result = await technicianService.applyLeaveService(
      technicianId,
      date,
      reason,
      type,
    );

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    let message = "Something went wrong";
    let statusCode = 500;

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      "statusCode" in error
    ) {
      message = (error as { message: string }).message;
      statusCode = (error as { statusCode: number }).statusCode;
    } else if (error instanceof Error) {
      message = error.message;
    }

    console.error("Leave Error:", message);

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getLeaveHistory = async (req: Request, res: Response) => {
  const technicianId = (req as unknown as { technicianId: string })
    .technicianId;

  try {
    const data = await technicianService.getLeaveHistoryService(technicianId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    let message = "Something went wrong";
    let statusCode = 500;

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      "statusCode" in error
    ) {
      message = (error as { message: string }).message;
      statusCode = (error as { statusCode: number }).statusCode;
    } else if (error instanceof Error) {
      message = error.message;
    }

    console.error("Leave History Error:", message);

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const createToolRequest = async (req: Request, res: Response) => {
  const technicianId = (req as unknown as { technicianId: string })
    .technicianId;

  if (!technicianId) {
    return res.status(400).json({
      success: false,
      message: "Technician ID is required",
    });
  }

  try {
    const result = await technicianService.createToolRequestService(
      technicianId,
      req.body,
    );

    return res.status(201).json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error: unknown) {
    let message = "Something went wrong";
    let statusCode = 500;

    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      "message" in error
    ) {
      statusCode = (error as { statusCode: number }).statusCode;
      message = (error as { message: string }).message;
    } else if (error instanceof Error) {
      message = error.message;
    }

    console.error("Tool Request Error:", message);

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const deleteToolRequest = async (req: Request, res: Response) => {
  const technicianId = (req as unknown as { technicianId?: string })
    .technicianId;
  const { requestId } = req.params;

  if (!technicianId) {
    return res.status(400).json({
      success: false,
      message: "Technician ID is required",
    });
  }

  if (!requestId) {
    return res.status(400).json({
      success: false,
      message: "Request ID is required",
    });
  }

  const result = await technicianService.deleteToolRequestService(
    technicianId,
    requestId,
  );

  return res.status(result.statusCode).json({
    success: result.success,
    message: result.message,
  });
};

export const getMyToolRequests = async (req: Request, res: Response) => {
  const technicianId = (req as unknown as { technicianId: string })
    .technicianId;

  try {
    const data = await technicianService.getMyToolRequestsService(technicianId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error: unknown) {
    let message = "Something went wrong";
    let statusCode = 500;

    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      "statusCode" in error
    ) {
      message = (error as { message: string }).message;
      statusCode = (error as { statusCode: number }).statusCode;
    } else if (error instanceof Error) {
      message = error.message;
    }

    console.error("Tool Request Fetch Error:", message);

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const getAssignedTools = async (req: Request, res: Response) => {
  const technicianId = (req as unknown as { technicianId: string })
    .technicianId;

  if (!technicianId) {
    return res.status(400).json({
      success: false,
      message: "Technician ID is required",
    });
  }

  try {
    const result =
      await technicianService.getAssignedToolsService(technicianId);

    return res.status(result.statusCode).json({
      success: result.statusCode === 200,
      message: result.message,
      data: result.data,
    });
  } catch (error: unknown) {
    let message = "Something went wrong";
    let statusCode = 500;

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      "statusCode" in error
    ) {
      statusCode = (error as { statusCode: number }).statusCode;
      message = (error as { message: string }).message;
    }

    console.error("Assigned Tools Error:", message);

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

export const technicianList = async (req: Request, res: Response) => {
  try {
    const result = await technicianService.getTechnicianListService(req.query);

    if (result.technicians.length > 0) {
      return res.status(200).json({
        success: true,
        data: result.technicians,
        count: result.totalTechnicians,
        pagination: {
          total: result.totalTechnicians,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    }

    return res.status(200).json({
      success: false,
      message: "No technicians found",
      data: [],
      count: 0,
    });
  } catch (error) {
    const err = error as Error;

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: err.message,
    });
  }
};

export const getAvailableTechnicians = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { technicians, totalTechnicians } =
      await technicianService.getAvailableTechniciansService(page, limit);

    return res.status(200).json({
      success: true,
      message: "Available technicians fetched successfully",
      data: technicians,
      count: totalTechnicians,
      pagination: {
        totalTechnicians,
        page,
        limit,
        totalPages: Math.ceil(totalTechnicians / limit),
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: errorMessage,
      data: null,
    });
  }
};

export const technicianAssignedBookingList = async (
  req: Request,
  res: Response,
) => {
  const { technicianId } = req.params;

  if (!technicianId || !mongoose.Types.ObjectId.isValid(technicianId)) {
    return res.status(400).json({
      success: false,
      message: "Valid technician ID is required",
    });
  }

  try {
    const result = await technicianService.technicianAssignedBookingListService(
      technicianId,
      req.query,
    );

    res.status(200).json({
      success: true,
      data: result.bookings,
      total: result.total,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: (err as Error).message,
    });
  }
};
