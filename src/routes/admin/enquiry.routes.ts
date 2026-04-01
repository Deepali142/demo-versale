import express, { Router } from "express";
import { createEnquiryController, getEnquiriesByUserController, getEnquiryByIdController } from "../../controllers/enquiry/enquiry.controller";
import { authenticate } from "../../middlewares/user/auth";

const router: Router = express.Router();

// Create enquiry
router.post(
  "/admin/enquiry/create",
  authenticate,
  createEnquiryController
);

// Get enquiry by ID
router.get(
  "/admin/enquiry/:id",
  getEnquiryByIdController
);

// Get enquiries by user
router.get(
  "/admin/user/enquiry/list/:userId",
  getEnquiriesByUserController
);


export default router;