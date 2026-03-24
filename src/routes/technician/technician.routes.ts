import { Router } from "express";
import * as otpController from "../../controllers/technician/otp.controller";
import * as authController from "../../controllers/technician/auth.controller";
import * as technicianController from "../../controllers/technician/technician.controller";
import { authenticate } from "../../middlewares/technician/auth";
import { authSchema } from "../../validators/auth/auth.validator";
import { validateRequest } from "../../middlewares/request/validateRequest";
import { updateKycSchema } from "../../validators/technician/KYCDoc.valitator";
import { attendanceValidationSchema } from "../../validators/technician/attendance.validator";
import {
  applyLeaveSchema,
  technicianSchema,
} from "../../validators/technician/technician.validator";
// import { updateTechnicianSchema } from "../../validators/technician/technician.validator";

const router = Router();

// Technician controllers routes
router.post(
  "/technician/register",
  validateRequest(authSchema),
  technicianController.registerTechnician,
);

router.post(
  "/technician/login",
  validateRequest(authSchema),
  technicianController.loginRegisterTechnician,
);

router.post("/technician/resend-otp", otpController.resendOtp);
router.post("/technician/verify-otp", otpController.verifyOtp);
router.post("/technician/refresh", authController.refresh);
router.get(
  "/technician/profile/:id",
  authenticate,
  technicianController.getTechnicianById,
);

// router.get("/technician/all", technicianController.getAllTechnicians);

router.put(
  "/technician/:id",
  validateRequest(technicianSchema),
  technicianController.editTechnician,
);

router.delete("/technician/:id", technicianController.deleteTechnician);

// KYC
router.post(
  "/technician/kyc",
  authenticate,
  validateRequest(updateKycSchema),
  technicianController.updateKyc,
);

router.post(
  "/technician/review-kyc",
  authenticate,
  technicianController.createKycReviewRequest,
);

router.post("/technician/kyc", authenticate, technicianController.getKyc);

// Attendance
router.post(
  "/technician/attendance",
  authenticate,
  validateRequest(attendanceValidationSchema),
  technicianController.markAttendance,
);

router.get(
  "/technician/attendance",
  authenticate,
  technicianController.getAttendanceDataForDateRange,
);

// Leave
router.post(
  "/technician/leave",
  authenticate,
  validateRequest(applyLeaveSchema),
  technicianController.applyLeave,
);

router.get(
  "/technician/leave",
  authenticate,
  technicianController.getLeaveHistory,
);

// Request Tools
router.post(
  "/technician/tools/request",
  authenticate,
  technicianController.createToolRequest,
);

router.delete(
  "/technician/tools/request/delete/:toolsRequestId",
  authenticate,
  technicianController.deleteToolRequest,
);

router.get(
  "/technician/tools/",
  authenticate,
  technicianController.getAssignedTools,
);

router.get(
  "/technician/tools/my-requests",
  authenticate,
  technicianController.getMyToolRequests,
);

export default router;
