import { Router } from "express";
import * as adminController from "../../controllers/admin/admin.controller";
import * as promoNotificationController from "../../controllers/admin/promoNotification.controller";
import * as otpController from "../../controllers/admin/otp.controller";
import * as authController from "../../controllers/admin/auth.controller";
import * as technicianController from "../../controllers/technician/technician.controller";
import * as userController from "../../controllers/user/user.controller";
import * as serviceController from "../../controllers/service/service.controller";
import * as bookingController from "../../controllers/booking/booking.controller";
import * as tools from "../../controllers/toolsAndToolsBag/tools.controller";
import * as toolsBagController from "../../controllers/toolsAndToolsBag/toolsBag.controller";
import * as toolsRequestController from "../../controllers/toolsAndToolsBag/toolsRequest.controller";
import * as leadsController from "../../controllers/leads/leads.controller";
import * as consultancyController from "../../controllers/consultancy/consultancy.controller";
import * as brandController from "../../controllers/brand/brand.controller";
import * as homeBannerController from "../../controllers/homeBanner/homeBanner.controller";
import * as partnerController from "../../controllers/partner/partner.controller";
import * as couponController from "../../controllers/coupon/coupon.controller";
import * as errorCodeController from "../../controllers/brand/errorCode.controller";
import { authenticate } from "../../middlewares/admin/auth";
import { authSchema } from "../../validators/auth/auth.validator";
import { validateRequest } from "../../middlewares/request/validateRequest";
import {
  adminConsultancyListSchema,
  adminCreateConsultancySchema,
  adminUpdateSchema,
} from "../../validators/admin/admin.validator";
import { updateUserSchema } from "../../validators/user/user.validator";
import {
  addServiceSchema,
  serviceListValidator,
} from "../../validators/service/service.validator";
import {
  // addOrderItemValidator,
  // bookingListValidator,
  createBookingSchema,
  // editBookingValidator,
  // userBookingListSchema,
} from "../../validators/booking/booking.validator";
import { updateKycSchema } from "../../validators/technician/KYCDoc.valitator";
import {
  technicianAssignedBookingListSchema,
  technicianIdParamValidator,
  technicianListValidator,
  technicianSchema,
  updateKycStatusValidator,
  updateProfessionalSkillsSchema,
} from "../../validators/technician/technician.validator";
import {
  addToolSchema,
  getToolListSchema,
  getToolRequestListQuerySchema,
  modifyToolInToolsBagSchema,
  removeToolIdParamsSchema,
  toolRequestValidatorSchema,
  updateToolBagSchema,
  updateToolRequestStatusBodySchema,
  updateToolSchema,
} from "../../validators/toolsAndToolsBag/toolsAndToolsBag.validator";
import {
  adminCreateEditBrandSchema,
  brandListQuerySchema,
} from "../../validators/brand/brand.validator";
import {
  bannerValidatorSchema,
  sortingQuerySchema,
} from "../../validators/homeBanner/homeBanner.validator";
import {
  addEditPartnerSchema,
  partnerListQuerySchema,
} from "../../validators/partner/partner.validator";
import {
  couponListQuerySchema,
  couponSchema,
} from "../../validators/coupon/coupon.validator";
import {
  createEditErrorCodeSchema,
  errorCodeListSchema,
} from "../../validators/brand/errorCode.validator";
import { upload } from "../../middlewares/fileHandler/fileHandler";
import {
  createDashboardItem,
  getDashboardItems,
} from "../../controllers/dashboard/dashboard.controller";
import { bannerValidator } from "../../validators/admin/home.validator";

const router = Router();

// Admin controllers routes
router.post(
  "/admin/register",
  validateRequest(authSchema),
  adminController.registerAdmin,
);
router.post(
  "/admin/login",
  validateRequest(authSchema),
  adminController.loginRegisterAdmin,
);
router.post("/admin/resend-otp", otpController.resendOtp);
router.post("/admin/verify-otp", otpController.verifyOtp);
router.post("/admin/refresh", authController.refresh);
router.get("/admin/profile/:id", authenticate, adminController.getAdminById);
router.get("/admin/all/", authenticate, adminController.getAdmins);
router.delete("/admin/delete/:id", authenticate, adminController.deleteAdmin);
router.put(
  "/admin/update/:id",
  authenticate,
  validateRequest(adminUpdateSchema),
  adminController.updateAdmin,
);

// Technician controllers routes
router.post(
  "/admin/technician/register",
  technicianController.registerTechnician,
);

router.post(
  "/admin/technician/kyc/manage/:technicianId",
  authenticate,
  validateRequest(updateKycSchema),
  technicianController.updateKyc,
);

router.post(
  "/admin/technician/kyc-status",
  authenticate,
  validateRequest(updateKycStatusValidator),
  technicianController.updateKycStatus,
);

router.post(
  "/admin/technician/status/:technicianId",
  authenticate,
  validateRequest(technicianIdParamValidator),
  technicianController.toggleTechnicianStatus,
);

router.get(
  "/admin/technician/:technicianId",
  authenticate,
  technicianController.getTechnicianById,
);

router.put(
  "/admin/technician/professional-skill/:technicianId",
  authenticate,
  validateRequest(updateProfessionalSkillsSchema),
  technicianController.updateProfessionalSkills,
);

router.put(
  "/admin/technician/edit/:technicianId",
  authenticate,
  validateRequest(technicianSchema),
  technicianController.editTechnician,
);

router.get(
  "/admin/technician/list",
  authenticate,
  validateRequest(technicianListValidator),
  technicianController.technicianList,
);

router.get(
  "/admin/technician/list/available",
  authenticate,
  technicianController.getAvailableTechnicians,
);

router.get(
  "/admin/technician/assigned/booking/list/:technicianId",
  authenticate,
  validateRequest(technicianAssignedBookingListSchema),
  technicianController.technicianAssignedBookingList,
);

// User controllers routes
router.post("/admin/user/register", userController.registerUser);
router.get("/admin/user/profile/:id", authenticate, userController.getUserById);
router.get(
  "/admin/user/addresses-list/:userId",
  authenticate,
  userController.userAddresses,
);
router.put(
  "/admin/user/update/:id",
  validateRequest(updateUserSchema),
  userController.updateUser,
);
router.delete("/admin/user/delete/:id", userController.deleteUser);
router.get("/admin/user/list", authenticate, userController.userList);
router.post(
  "/admin/user/toggle-active/:id",
  authenticate,
  userController.activeInactiveUser,
);

// Tools and tools bag controller routes
router.post(
  "/admin/tools/add",
  authenticate,
  validateRequest(addToolSchema),
  tools.addTool,
);

router.put(
  "/admin/tools/edit/:toolId",
  authenticate,
  validateRequest(updateToolSchema),
  tools.updateTool,
);

router.get(
  "/admin/tools",
  authenticate,
  validateRequest(getToolListSchema),
  tools.getToolList,
);

router.delete(
  "/admin/tools/delete/:toolId",
  authenticate,
  validateRequest(removeToolIdParamsSchema),
  tools.removeTool,
);

// Tools bag controller routes
router.post(
  "/admin/tools-bag/create",
  authenticate,
  validateRequest(addToolSchema),
  toolsBagController.addToolBag,
);

router.put(
  "/admin/tools-bag/edit/:toolsBagId",
  authenticate,
  validateRequest(updateToolBagSchema),
  toolsBagController.updateToolBag,
);

router.get(
  "/admin/tools-bag/list",
  authenticate,
  validateRequest(getToolListSchema),
  toolsBagController.getToolBagList,
);

router.get(
  "/admin/tools-bag/:toolsBagId",
  authenticate,
  toolsBagController.getToolBagById,
);

router.get(
  "/admin/tools-bag/delete/:toolsBagId",
  authenticate,
  toolsBagController.deleteToolBag,
);

router.put(
  "/admin/tools-bag/manage-tools/:toolsBagId",
  authenticate,
  validateRequest(modifyToolInToolsBagSchema),
  toolsBagController.modifyToolInToolsBag,
);

router.post(
  "/admin/tools/request",
  authenticate,
  validateRequest(toolRequestValidatorSchema),
  toolsRequestController.createToolRequest,
);

router.get(
  "/admin/tools/request/list",
  authenticate,
  validateRequest(getToolRequestListQuerySchema),
  toolsRequestController.getToolRequestList,
);

router.put(
  "/admin/tools/request/update-status/:requestId",
  authenticate,
  validateRequest(updateToolRequestStatusBodySchema),
  toolsRequestController.updateToolRequestStatus,
);

// Service controller routes
router.post(
  "/admin/service/add",
  // authenticate,
  validateRequest(addServiceSchema),
  serviceController.addService,
);

router.put(
  "/admin/service/edit/:serviceId",
  authenticate,
  serviceController.editService,
);

router.get(
  "/admin/service/get/:serviceId",
  authenticate,
  serviceController.getServiceById,
);

router.post(
  "/admin/service/active-inactive/:serviceId",
  authenticate,
  serviceController.serviceActiveInactive,
);

router.get(
  "/admin/service/list",
  authenticate,
  validateRequest(serviceListValidator),
  serviceController.serviceList,
);

// Booking controller routes
router.post(
  "/admin/booking/add",
  validateRequest(createBookingSchema),
  authenticate,
  bookingController.addBookingController,
);

router.get(
  "/admin/booking/:bookingId",
  authenticate,
  bookingController.getBookingById,
);

router.put(
  "/admin/booking/edit/:bookingId",
  authenticate,
  // validateRequest(editBookingValidator),
  bookingController.editBooking,
);

router.get(
  "/admin/booking/list",
  // validateRequest(bookingListValidator),
  authenticate,
  bookingController.bookingList,
);

router.get(
  "/admin/booking-list",
  authenticate,
  // validateRequest(bookingListValidator),
  bookingController.ListOfBooking,
);

router.get(
  "/admin/user/booking/:userId",
  authenticate,
  // validateRequest(userBookingListSchema.params),
  bookingController.userBookingList,
);

router.post(
  "/admin/booking/order-item/add-edit",
  // validateRequest(addOrderItemValidator),
  authenticate,
  bookingController.addOrderItem,
);

router.get(
  "/admin/booking/generate-invoice/:bookingId",
  authenticate,
  bookingController.generateInvoice,
);

router.post(
  "/admin/booking/assign-technician",
  authenticate,
  bookingController.assignTechnician,
);

router.post(
  "/admin/booking/manage/status",
  authenticate,
  bookingController.manageBookingStatus,
);

// Leads controller routes
router.get("/admin/leads", authenticate, leadsController.getAdminLeadList);
router.get(
  "/admin/lead/:leadId",
  authenticate,
  leadsController.getAdminLeadDetails,
);

// Consultancy controller routes
router.post(
  "/admin/consultancy/create",
  authenticate,
  validateRequest(adminCreateConsultancySchema),
  consultancyController.adminCreateConsultancy,
);

router.get(
  "/admin/consultancy/:consultancyId",
  authenticate,
  consultancyController.adminConsultancyDetails,
);

router.get(
  "/admin/consultancy/list",
  authenticate,
  validateRequest(adminConsultancyListSchema),
  consultancyController.adminConsultancyList,
);

// Brand controller routes
router.post(
  "/admin/brand/create-edit",
  authenticate,
  validateRequest(adminCreateEditBrandSchema),
  brandController.adminCreateEditBrand,
);

router.post(
  "/admin/brand/toggle-status/:brandId",
  authenticate,
  brandController.adminBrandActiveInactive,
);

router.get(
  "/admin/brands",
  authenticate,
  validateRequest(brandListQuerySchema),
  brandController.adminBrandList,
);

// home banner controller routes
router.post(
  "/admin/home-banner/add",
  authenticate,
  validateRequest(bannerValidatorSchema),
  homeBannerController.addHomeBanner,
);

router.put(
  "/admin/home-banner/edit/:homeBannerId",
  authenticate,
  validateRequest(bannerValidatorSchema),
  homeBannerController.editHomeBanner,
);

router.get(
  "/admin/home-banner/list",
  authenticate,
  validateRequest(sortingQuerySchema),
  homeBannerController.getHomeBannerList,
);

router.delete(
  "/admin/home-banner/delete/:homeBannerId",
  authenticate,
  homeBannerController.deleteHomeBanner,
);

// Partner controller routes
router.post(
  "/admin/partner/add-edit/:partnerId",
  authenticate,
  validateRequest(addEditPartnerSchema),
  partnerController.addEditPartner,
);

router.get(
  "/admin/partner/list",
  authenticate,
  validateRequest(partnerListQuerySchema),
  partnerController.partnerList,
);

router.get(
  "/admin/partner/:partnerId",
  authenticate,
  partnerController.getPartnerById,
);

router.post(
  "/admin/partner/active-inactive/:partnerId",
  authenticate,
  partnerController.partnerActiveInactive,
);

// coupon
router.post(
  "/admin/coupon/add-edit",
  authenticate,
  validateRequest(couponSchema),
  couponController.addEditCoupon,
);

router.get(
  "/admin/coupon/list",
  authenticate,
  validateRequest(couponListQuerySchema),
  couponController.couponList,
);

router.get(
  "/admin/coupon/:couponId",
  authenticate,
  couponController.getCouponById,
);

router.put(
  "/admin/coupon/active-inactive/:couponId",
  authenticate,
  couponController.couponActiveInactive,
);

// ErrorCode
router.post(
  "/admin/error-code/createEdit",
  authenticate,
  validateRequest(createEditErrorCodeSchema),
  errorCodeController.adminCreateEditErrorCode,
);

router.get(
  "/admin/error-code/list/:brandId",
  authenticate,
  validateRequest(errorCodeListSchema),
  errorCodeController.adminErrorCodeList,
);

router.post(
  "/admin/error-code/excel/upload",
  authenticate,
  upload.single("file"),
  errorCodeController.adminExcelErrorCodeUpload,
);

// promo notification
router.post(
  "/admin/promotion-notification",
  authenticate,
  promoNotificationController.sendPromoNotification,
);

router.get(
  "/admin/promotion-notification/list",
  authenticate,
  promoNotificationController.adminPromoNotificationList,
);

router.get("/admin/dashboard-items", getDashboardItems);

router.post("/admin/dashboard-items", createDashboardItem);

router.get(
  "/admin/generate-presigned-url",
  adminController.generatePresignedUrlController,
);

// Home Banner
router.post(
  "/admin/home-banner/create",
  bannerValidator,
  homeBannerController.addHomeBanner,
);

router.post(
  "/admin/home-banner/edit",
  bannerValidator,
  homeBannerController.editHomeBanner,
);

router.post(
  "/admin/home-banner/manage/status/:bannerId",
  homeBannerController.toggleBannerStatusController,
);

router.delete(
  "/admin/home-banner/delete/:bannerId",
  homeBannerController.deleteHomeBanner,
);

router.get("/admin/home-banner/list", homeBannerController.getHomeBannerList);

export default router;
