import { Router } from "express";
import * as userController from "../../controllers/user/user.controller";
import * as otpController from "../../controllers/user/otp.controller";
import * as authController from "../../controllers/user/auth.controller";
import * as leadsController from "../../controllers/leads/leads.controller";
import * as consultancyController from "../../controllers/consultancy/consultancy.controller";
import * as brandController from "../../controllers/brand/brand.controller";
import * as partnerController from "../../controllers/partner/partner.controller";
import * as couponController from "../../controllers/coupon/coupon.controller";
import * as serviceController from "../../controllers/service/service.controller";
import * as bookingController from "../../controllers/booking/booking.controller";
import * as errorCodeController from "../../controllers/brand/errorCode.controller";

import { authenticate } from "../../middlewares/user/auth";
import { authSchema } from "../../validators/auth/auth.validator";
import { validateRequest } from "../../middlewares/request/validateRequest";
import {
  addEditAddressSchema,
  createLeadSchema,
  updateUserSchema,
} from "../../validators/user/user.validator";
import { upload } from "../../middlewares/fileHandler/fileHandler";
import { createConsultancySchema } from "../../validators/consultancy/consultancy.validator";
import { userBrandListQuerySchema } from "../../validators/brand/brand.validator";
import { applyCouponSchema } from "../../validators/coupon/coupon.validator";
import { bannerValidatorSchema } from "../../validators/homeBanner/homeBanner.validator";
import { errorCodeListSchema } from "../../validators/brand/errorCode.validator";

const router = Router();

// User controllers routes
router.post(
  "/user/register",
  validateRequest(authSchema),
  userController.registerUser,
);

router.post(
  "/user/login",
  validateRequest(authSchema),
  userController.loginRegisterUser,
);

router.post("/user/resend-otp", otpController.resendOtp);

router.post("/user/verify-otp", otpController.verifyOtp);

router.post("/user/refresh", authController.refresh);

router.get("/user/profile/:id", authenticate, userController.getUserById);

router.put(
  "/user/update/:id",
  validateRequest(updateUserSchema),
  userController.updateUser,
);

router.delete("/user/delete/:id", userController.deleteUser);

// User Addresses
router.get("/user/addresses/:userId", userController.userActiveAddresses);

router.post(
  "/user/address/add-edit/:addressId",
  authenticate,
  validateRequest(addEditAddressSchema),
  userController.addEditAddress,
);

router.delete(
  "/user/address/delete/:addressId",
  authenticate,
  userController.deleteUserAddress,
);

// Home screen data
router.get("/user/home/home-screen-data", userController.getUserHomeScreenList);

// User Leads controller routes
router.post(
  "/user/leads/create",
  authenticate,
  validateRequest(createLeadSchema),
  leadsController.createLead,
);

router.get(
  "/user/leads/:leadId",
  authenticate,
  leadsController.getUserLeadDetails,
);

router.get("/user/leads/list", authenticate, leadsController.getUserLeadList);

// Consultancy
router.post(
  "/user/consultancy/create",
  authenticate,
  validateRequest(createConsultancySchema),
  upload.single("file"),
  consultancyController.createConsultancy,
);

router.get(
  "/user/consultancy/:consultancyId",
  authenticate,
  consultancyController.userConsultancyDetails,
);

router.get(
  "/user/consultancy/list",
  authenticate,
  consultancyController.userConsultancyList,
);

// Booking controller user
router.post(
  "/user/booking/add",
  authenticate,
  validateRequest(bannerValidatorSchema),
  bookingController.addBookingController,
);

router.get(
  "/user/booking/list",
  authenticate,
  bookingController.mobileBookingList,
);

router.get(
  "/user/booking/details/:bookingId",
  authenticate,
  bookingController.mobileBookingDetails,
);

router.get(
  "/user/booking/summary/:bookingId",
  authenticate,
  bookingController.mobileBookingSummary,
);

// Brand List for User
router.post(
  "/user/brand/list",
  authenticate,
  validateRequest(userBrandListQuerySchema),
  brandController.userBrandList,
);

// Partner
router.get(
  "/user/partner-list",
  authenticate,
  partnerController.mobilePartnerList,
);

// Coupon
router.post(
  "/user/coupon/apply-coupon",
  authenticate,
  validateRequest(applyCouponSchema),
  couponController.applyCouponCode,
);

// Services
router.get(
  "/admin/service/mobile-list",
  authenticate,
  serviceController.mobileServiceList,
);

// ErrorCode
router.get(
  "/user/error-code/list",
  authenticate,
  validateRequest(errorCodeListSchema),
  errorCodeController.errorCodeList,
);

export default router;
