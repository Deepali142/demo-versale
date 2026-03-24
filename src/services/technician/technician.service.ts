import mongoose, { PipelineStage } from "mongoose";
import Technician, {
  ITechnician,
} from "../../models/technician/technician.model";
import * as technicianotpService from "../technician/otp.service";
import { Types } from "mongoose";
import { Booking } from "../../models/booking/booking.model";
import { Attendance } from "../../models/Attendance/attendance.model";
import { Leave } from "../../models/Attendance/leave.model";
import { Holiday } from "../../models/Attendance/holiday.model";
import { ToolRequest } from "../../models/toolsAndToolsBag/toolsRequest.model";

interface TechnicianInput {
  name: string;
  phoneNumber: string;
  joiningDate?: Date;
  profilePhoto?: string;
  position: string;
  secondaryContactNumber?: string;
  countryCode: string;
  type: string;
  email?: string;
  dob?: Date;
}

export interface TechnicianQuery {
  page?: string;
  limit?: string;
  sortby?: string;
  orderby?: "asc" | "desc";
  search?: string;
  type?: string;
  position?: string;
  status?: string;
  kycStatus?: string;
}

export interface TechnicianBookingQuery extends TechnicianQuery {
  startDate?: string;
  endDate?: string;
}

interface TechnicianListResult {
  technicians: unknown[];
  totalTechnicians: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BookingListItem {
  _id: string;
  date: Date;
  status: string;
  slot: string;
  order_id: string;
  bookingId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TechnicianBookingListResult {
  bookings: BookingListItem[];
  total: number;
}

interface ProfessionalSkill {
  acType: string;
  service: boolean;
  repair: boolean;
  install: boolean;
}

export interface BookingMatchCondition {
  assigned_to?: Types.ObjectId;
  date?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export type KycAction = "REQUEST" | "APPROVE" | "REJECT";

interface UpdateKycStatusInput {
  technicianId: string;
  action: KycAction;
}

/** Match filter structure */
interface MatchConditions {
  $and?: Record<string, unknown>[];
}

interface MarkAttendanceParams {
  technicianId: string;
  date: string;
  type: "PRESENT" | "ABSENT" | "LEAVE" | "HOLIDAY";
  description?: string;
}

const KYC_PENDING = "KYC_PENDING";
const REQUESTED = "REQUESTED";
const VERIFIED = "VERIFIED";
const REJECTED = "REJECTED";
const AVAILABLE = "AVAILABLE";
const TBU = "TBU"; // To be uploaded
const SIGNED_UP = "SIGNED_UP";
const TBA = "TBA";
const DISABLED = "DISABLED";

export const createTechnician = async (data: TechnicianInput) => {
  const {
    name,
    phoneNumber,
    joiningDate,
    profilePhoto,
    position,
    secondaryContactNumber,
    countryCode,
    type,
    email,
    dob,
  } = data;

  // Check if technician already exists
  const existingTechnician = await Technician.findOne({
    countryCode,
    phoneNumber,
  });
  if (existingTechnician) {
    throw new Error("A technician with the given phone number already exists");
  }

  // Create technician
  const technician = await Technician.create({
    name: name,
    phoneNumber: phoneNumber,
    joiningDate: joiningDate || new Date(),
    position: position || TBA,
    type: type,
    countryCode: countryCode,
    profilePhoto: profilePhoto || "",
    status: SIGNED_UP,
    kycStatus: TBU,
    secondaryContactNumber: secondaryContactNumber || "",
    dob: dob || null,
    email: email || null,
    registred: false,
  });

  return technician;
};

export const loginTechnician = async (
  countryCode: string,
  phoneNumber: string,
) => {
  const technician = await Technician.findOne({ countryCode, phoneNumber });
  if (!technician) throw new Error("Technician not found");

  if (!technician.phoneNumber)
    throw new Error("Technician does not have a phone number");

  // Send OTP
  const fullPhone = technician.countryCode?.startsWith("+")
    ? `${technician.countryCode}${technician.phoneNumber}`
    : `+${technician.countryCode}${technician.phoneNumber}`;

  await technicianotpService.createOtp(String(technician._id), fullPhone);
  return technician;
};

// Get technician by ID
export const getTechnicianByIdService = async (technicianId: string) => {
  const technician = await Technician.findById(technicianId);

  if (!technician) throw new Error("Technician not found");
  return technician;
};

// Get all technicians
// export const getAllTechnicians = async () => {
//   const technicians = await Technician.find().lean();
//   return technicians;
// };

// Update technician by ID
// export const updateTechnicianById = async (
//   id: string,
//   updateData: Partial<TechnicianInput>,
// ) => {
//   const technician = await Technician.findByIdAndUpdate(id, updateData, {
//     new: true,
//   });
//   if (!technician) throw new Error("Technician not found");
//   return technician;
// };

export const updateTechnicianService = async (
  technicianId: string,
  data: Partial<ITechnician>,
) => {
  // Validate ID inside service // Implemented in controller will be deleted later
  // if (!technicianId) {
  //   return { success: false, code: 400, message: "Technician ID is required" };
  // }

  // Check if technician exists
  const existingTechnician = await Technician.findById(technicianId);
  if (!existingTechnician) {
    return {
      success: false,
      code: 404,
      message: "Technician not found",
    };
  }

  // Build update data by preserving old values
  const updatedFields = {
    name: data.name ?? existingTechnician.name,
    joiningDate: data.joiningDate ?? existingTechnician.joiningDate,
    profilePhoto: data.profilePhoto ?? existingTechnician.profilePhoto,
    position: data.position ?? existingTechnician.position,
    type: data.type ?? existingTechnician.type,
    dob: data.dob ?? existingTechnician.dob,
    email: data.email ?? existingTechnician.email,
    secondaryContactNumber:
      data.secondaryContactNumber ?? existingTechnician.secondaryContactNumber,
  };

  const updated = await Technician.updateOne(
    { _id: technicianId },
    updatedFields,
  );

  return updated;
};

export const updateProfessionalSkillsService = async (
  technicianId: string,
  skills: ProfessionalSkill[],
) => {
  const technician = await Technician.findById(technicianId);

  if (!technician) {
    throw new Error("Technician not found");
  }

  technician.professionalSkills = skills;
  await technician.save();

  return technician;
};

// Delete technician by ID
export const deleteTechnicianById = async (id: string) => {
  const technician = await Technician.findByIdAndDelete(id);
  if (!technician) throw new Error("Technician not found or already deleted");
  return technician;
};

export const updateKycService = async (
  technicianId: string,
  type: string,
  docUrl: string,
  uploadedBy: "admin" | "technician",
): Promise<void> => {
  const comment =
    uploadedBy === "technician"
      ? "Uploaded by technician"
      : "Uploaded by admin";

  const technician = await Technician.findById(
    new Types.ObjectId(technicianId),
  );
  if (!technician) {
    throw new Error("Technician not found");
  }

  // Try updating existing KYC doc
  const updateResult = await Technician.updateOne(
    {
      _id: technicianId,
      "kycDocs.type": type.toUpperCase(),
    },
    {
      $set: {
        "kycDocs.$.url": docUrl,
        "kycDocs.$.comment": comment,
      },
    },
  );

  // If document type does not exist, push a new one
  if (updateResult.matchedCount === 0) {
    await Technician.updateOne(
      { _id: technicianId },
      {
        $push: {
          kycDocs: { type: type.toUpperCase(), url: docUrl, comment },
        },
      },
    );
  }
};

export const updateKycStatusService = async ({
  technicianId,
  action,
}: UpdateKycStatusInput) => {
  const technician = await Technician.findById(technicianId);

  if (!technician) {
    return {
      success: false,
      statusCode: 404,
      message: "Technician not found",
    };
  }

  // Prepare status update object
  const updateData = {
    kycStatus: technician.kycStatus,
    status: technician.status,
  };

  switch (action) {
    case "REQUEST":
      updateData.kycStatus = REQUESTED;
      updateData.status = KYC_PENDING;
      break;

    case "APPROVE":
      updateData.kycStatus = VERIFIED;
      updateData.status = AVAILABLE;
      break;

    case "REJECT":
      updateData.kycStatus = REJECTED;
      updateData.status = KYC_PENDING;
      break;
  }

  await Technician.findByIdAndUpdate(technicianId, updateData, { new: true });

  return {
    success: true,
    statusCode: 200,
    message: `Technician KYC ${action}ED successfully`,
    data: updateData,
  };
};

export const getKycService = async (technicianId: string) => {
  if (!technicianId) {
    throw new Error("Technician ID is required");
  }

  const technician = await Technician.findById(technicianId);

  if (!technician) {
    throw new Error("Technician not found");
  }

  return technician.kycDocs;
};

export const createKycReviewRequestService = async (technicianId: string) => {
  if (!technicianId) {
    throw new Error("Technician ID is required");
  }

  const technician = await Technician.findById(technicianId);
  if (!technician) {
    throw new Error("Technician not found");
  }

  const updatedTechnician = await Technician.findByIdAndUpdate(
    technicianId,
    { kycStatus: "REVIEW_REQUESTED" },
    { new: true },
  );

  return updatedTechnician;
};

export const markAttendanceService = async ({
  technicianId,
  date,
  type,
  description,
}: MarkAttendanceParams) => {
  // Validate technicianId
  if (!technicianId) {
    throw new Error("Technician ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(technicianId)) {
    throw new Error("Invalid technician ID format");
  }

  // Validate date
  if (!date || isNaN(Date.parse(date))) {
    throw new Error("Valid date is required");
  }

  // Validate type
  const allowedTypes = ["PRESENT", "ABSENT", "LEAVE", "HOLIDAY"];
  if (!allowedTypes.includes(type)) {
    throw new Error("Invalid attendance type");
  }

  // Check technician exists
  const technician = await Technician.findById(technicianId);
  if (!technician) {
    throw new Error("Technician not found");
  }

  const attendanceRecord = new Attendance({
    technicianId,
    date: new Date(date),
    type,
    description: description || "NOT PROVIDED",
  });

  await attendanceRecord.save();

  return attendanceRecord;
};

export const getAttendanceDataForDateRangeService = async (
  technicianId: string,
  startDate: string,
  endDate: string,
) => {
  try {
    const attendanceData = await Attendance.find({
      technicianId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    }).sort({ date: -1 });

    return attendanceData;
  } catch {
    throw new Error("Failed to fetch attendance data");
  }
};

export interface LeaveDataResult {
  leavesRemaining: number;
  totalLeavesAllowed: number;
  leavesTaken: number;
}

export const getLeaveData = async (
  technicianId: string,
  technicianData?: ITechnician | null,
): Promise<LeaveDataResult> => {
  if (!technicianId) {
    throw new Error("Technician ID is required");
  }

  try {
    // Use passed technician data or fetch fresh
    let technician = technicianData;
    if (!technician) {
      technician = await Technician.findById(technicianId);
    }

    if (!technician) {
      throw new Error("Technician not found");
    }

    const totalLeavesAllowed = technician.totalLeaves ?? 12; // Default value 12

    const leavesTaken = await Leave.countDocuments({
      technicianId,
      status: { $in: ["APPROVED", "PENDING"] },
    });

    const leavesRemaining = totalLeavesAllowed - leavesTaken;

    return {
      leavesRemaining,
      totalLeavesAllowed,
      leavesTaken,
    };
  } catch (error: unknown) {
    let message = "Failed to fetch leave data";

    if (error instanceof Error) {
      message = error.message;
    }

    throw new Error(message); // Controller will handle final response
  }
};

// leave
export const applyLeaveService = async (
  technicianId: string,
  date: string,
  reason: string,
  type: string,
) => {
  try {
    const isHoliday = await Holiday.findOne({ date: new Date(date) });

    if (isHoliday) {
      throw {
        statusCode: 400,
        message: "Cannot apply for leave on a holiday",
      };
    }

    const technician = await Technician.findById(technicianId);
    if (!technician) {
      throw {
        statusCode: 404,
        message: "Technician not found",
      };
    }

    const leaveData = await getLeaveData(technicianId, technician);

    if (leaveData.leavesRemaining <= 0) {
      throw {
        statusCode: 400,
        message: "No leaves remaining",
      };
    }

    const leaveRecord = new Leave({
      technicianId,
      date,
      reason,
      leaveType: type.toUpperCase(),
      status: "PENDING",
    });

    // Safely decrement stored remaining/total leaves (fallback to allowed total if stored value is missing)
    technician.totalLeaves =
      (technician.totalLeaves ?? leaveData.totalLeavesAllowed) - 1;

    await technician.save();
    await leaveRecord.save();

    return { message: "Leave applied successfully" };
  } catch (error: unknown) {
    let message = "Internal server error";

    if (error instanceof Error) {
      message = error.message;
    }

    throw new Error(message); // Controller will handle final response
  } // pass exact error to controller
};

export const getLeaveHistoryService = async (technicianId: string) => {
  if (!technicianId) {
    throw {
      statusCode: 400,
      message: "Technician ID is required",
    };
  }

  try {
    const history = await Leave.find({ technicianId }).sort({ date: -1 });
    return history;
  } catch (err) {
    console.error("Service Error (Leave History):", err);
    throw {
      statusCode: 500,
      message: "Failed to fetch leave history",
    };
  }
};

export const createToolRequestService = async (
  technicianId: string,
  payload: {
    identifier: string;
    name: string;
    type?: string;
    quantity: number;
    comment?: string;
    reason?: string;
  },
) => {
  try {
    const { identifier, name, type, quantity, comment, reason } = payload;

    const newRequest = new ToolRequest({
      technicianId,
      identifier,
      name,
      type: type || "TOOL",
      quantity,
      status: "REQUESTED",
      comment: comment || "",
      description: comment || "",
      reason,
    });

    await newRequest.save();

    return {
      message: "Tool request submitted successfully",
      data: newRequest,
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw { message: error.message, statusCode: 500 };
    }
    throw { message: "Internal server error", statusCode: 500 };
  }
};

export const deleteToolRequestService = async (
  technicianId: string,
  requestId: string,
) => {
  try {
    const deletedRequest = await ToolRequest.findOneAndDelete({
      _id: requestId,
      technicianId,
    });

    if (!deletedRequest) {
      return {
        success: false,
        statusCode: 404,
        message: "Tool request not found",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Tool request deleted successfully",
    };
  } catch (error: unknown) {
    let errorMessage = "Something went wrong";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      statusCode: 500,
      message: errorMessage,
    };
  }
};

export const getMyToolRequestsService = async (technicianId: string) => {
  if (!technicianId) {
    throw {
      statusCode: 400,
      message: "Technician ID is required",
    };
  }

  try {
    const requests = await ToolRequest.find({ technicianId }).sort({
      createdAt: -1,
    });

    return requests;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw {
        statusCode: 500,
        message: error.message || "Failed to fetch tool requests",
      };
    }
    throw {
      statusCode: 500,
      message: "Failed to fetch tool requests",
    };
  }
};

export const getAssignedToolsService = async (technicianId: string) => {
  try {
    const assignedTools = await ToolRequest.find({
      technicianId,
      status: { $in: ["ASSIGNED", "PARTIALLY_ASSIGNED"] },
    }).sort({ createdAt: -1 });

    if (assignedTools.length === 0) {
      return {
        statusCode: 404,
        message: "No assigned tools found for this technician",
        data: null,
      };
    }

    return {
      statusCode: 200,
      message: "Assigned tools fetched successfully",
      data: assignedTools,
    };
  } catch (error: unknown) {
    let message = "Internal server error";

    if (error instanceof Error) {
      message = error.message;
    }

    // throw formatted error to controller
    throw {
      statusCode: 500,
      message,
    };
  }
};

export const toggleTechnicianStatusService = async (technicianId: string) => {
  const technician = await Technician.findById(technicianId);

  if (!technician) return null;

  let newStatus: string;

  if (technician.status === DISABLED) {
    newStatus = technician.kycStatus === VERIFIED ? AVAILABLE : KYC_PENDING;
  } else {
    newStatus = DISABLED;
  }

  const updatedTechnician = await Technician.findByIdAndUpdate(
    technicianId,
    { status: newStatus },
    { new: true },
  );

  return updatedTechnician;
};

export const getTechnicianListService = async (
  query: TechnicianQuery,
): Promise<TechnicianListResult> => {
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "10", 10);
  const offset = (page - 1) * limit;

  const sortField = query.sortby || "createdAt";
  const sortOrder = query.orderby === "asc" ? 1 : -1;

  const search = query.search || "";
  const type = query.type || "";
  const position = query.position || "";
  const status = query.status || "";
  const kycStatus = query.kycStatus || "";

  const matchConditions: MatchConditions = { $and: [] };

  if (search) {
    matchConditions.$and!.push({
      $or: [
        { phoneNumber: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
      ],
    });
  }

  if (type) matchConditions.$and!.push({ type });
  if (position) matchConditions.$and!.push({ position });
  if (status) matchConditions.$and!.push({ status });
  if (kycStatus) matchConditions.$and!.push({ kycStatus });

  if (matchConditions.$and!.length === 0) delete matchConditions.$and;

  const pipeline: PipelineStage[] = [
    { $match: matchConditions },
    {
      $project: {
        _id: 1,
        name: { $ifNull: ["$name", ""] },
        position: { $ifNull: ["$position", ""] },
        kycStatus: { $ifNull: ["$kycStatus", ""] },
        active: { $ifNull: ["$active", 0] },
        profilePhoto: { $ifNull: ["$profilePhoto", ""] },
        joiningDate: { $ifNull: ["$joiningDate", ""] },
        countryCode: { $ifNull: ["$countryCode", ""] },
        phoneNumber: { $ifNull: ["$phoneNumber", ""] },
        status: { $ifNull: ["$status", ""] },
        type: { $ifNull: ["$type", ""] },
        secondaryContactNumber: { $ifNull: ["$secondaryContactNumber", ""] },
        email: { $ifNull: ["$email", ""] },
        dob: { $ifNull: ["$dob", ""] },
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { [sortField]: sortOrder } },
    { $skip: offset },
    { $limit: limit },
  ];

  const technicians = await Technician.aggregate(pipeline);

  const totalTechnicians = await Technician.countDocuments(matchConditions);

  return {
    technicians,
    totalTechnicians,
    page,
    limit,
    totalPages: Math.ceil(totalTechnicians / limit),
  };
};

export const getAvailableTechniciansService = async (
  page: number,
  limit: number,
) => {
  const offset = (page - 1) * limit;

  const matchConditions = {
    position: { $ne: "HELPER" },
    status: "AVAILABLE",
    kycStatus: "VERIFIED",
  };

  const technicians = await Technician.find(matchConditions)
    .select("name phoneNumber _id status kycStatus position")
    .skip(offset)
    .limit(limit)
    .exec();

  const totalTechnicians = await Technician.countDocuments(matchConditions);

  return {
    technicians,
    totalTechnicians,
  };
};

export const technicianAssignedBookingListService = async (
  technicianId: string,
  query: TechnicianBookingQuery,
): Promise<TechnicianBookingListResult> => {
  const page = parseInt(query.page || "1", 10);
  const limit = parseInt(query.limit || "10", 10);
  const offset = (page - 1) * limit;

  const sortField = query.sortby || "createdAt";
  const sortOrder = query.orderby === "asc" ? 1 : -1;

  const startDate = query.startDate ? new Date(query.startDate) : null;
  const endDate = query.endDate ? new Date(query.endDate) : null;

  const matchConditions: BookingMatchCondition[] = [
    { assigned_to: new Types.ObjectId(technicianId) },
  ];

  if (startDate && endDate) {
    matchConditions.push({ date: { $gte: startDate, $lte: endDate } });
  } else if (startDate) {
    matchConditions.push({ date: { $gte: startDate } });
  } else if (endDate) {
    matchConditions.push({ date: { $lte: endDate } });
  }

  const pipeline: PipelineStage[] = [
    { $match: { $and: matchConditions } },
    {
      $project: {
        _id: 1,
        date: 1,
        status: 1,
        slot: 1,
        order_id: 1,
        bookingId: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
    { $sort: { [sortField]: sortOrder } },
    { $skip: offset },
    { $limit: limit },
  ];

  const bookings = await Booking.aggregate(pipeline);

  const countResult = await Booking.aggregate([
    { $match: { assigned_to: new Types.ObjectId(technicianId) } },
    { $count: "total" },
  ]);

  const total = countResult.length ? countResult[0].total : 0;

  return { bookings, total };
};
