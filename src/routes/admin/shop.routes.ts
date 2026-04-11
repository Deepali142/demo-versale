import { Router } from "express";
import { createProductController, getFeaturedProductByIdController, getFeaturedProductsController, getProductByIdController, productListController, updateProductController } from "../../controllers/shop/product.controller";
import { authenticate } from "../../middlewares/admin/auth";


const router = Router();

/* =========================================================
   PRODUCT ROUTES (ADMIN)
========================================================= */

// CREATE PRODUCT
router.post(
  "/admin/shop/product/create",
  authenticate, 
  createProductController
);

// UPDATE PRODUCT
router.put(
  "/admin/shop/product/update/:id",
  authenticate,
  updateProductController
);

// PRODUCT LIST
router.get(
  "/admin/shop/product-list",
  authenticate,
  productListController
);

// GET PRODUCT BY ID
router.get(
  "/admin/shop/product/:productId",
  authenticate,
  getProductByIdController
);

/* =========================================================
   FEATURED PRODUCT ROUTES
========================================================= */

// GET FEATURED PRODUCTS
router.get(
  "/admin/shop/featured-products",
  authenticate,
  getFeaturedProductsController
);

// GET FEATURED PRODUCT BY ID
router.get(
  "/admin/shop/featured-product/:productId",
  authenticate,
  getFeaturedProductByIdController
);

/* =========================================================
   PRESIGNED URL
========================================================= */
// router.get(
//   "/admin/shop/product/generate-presigned-url",
//   authenticate,
//   adminController.generatePresignedUrl
// );

/* =========================================================
   PURCHASE LEAD ROUTES
========================================================= */

// // CREATE LEAD
// router.post(
//   "/admin/shop/purchase/lead",
//   authenticate,
//   productController.createPurchaseLeadController
// );

// // UPDATE LEAD
// router.put(
//   "/admin/shop/purchase/lead/update/:purchaseLeadId",
//   authenticate,
//   productController.updatePurchaseLeadController
// );

// // GET ALL LEADS
// router.get(
//   "/admin/shop/purchase/leads",
//   authenticate,
//   productController.getPurchaseLeadsController
// );

// // GET LEAD BY ID
// router.get(
//   "/admin/shop/purchase/lead/:purchaseLeadId",
//   authenticate,
//   productController.getPurchaseLeadByIdController
// );

export default router;