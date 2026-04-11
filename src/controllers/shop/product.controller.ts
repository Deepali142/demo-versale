import { Request, Response } from "express";
import {
  createProductService,
  updateProductService,
  getProductListService,
  getProductByIdService,
  getFeaturedProductsService,
  getFeaturedProductByIdService,
  // createInterestedLeadService,
} from "../../services/shop/product.service";

import {
  ok,
  badRequest,
  notFound,
  serverError,
} from "../../middlewares/response/response";

/* =========================================================
   CREATE PRODUCT
========================================================= */
export const createProductController = async (req: Request, res: Response) => {
  try {
    const product = await createProductService(req.body);
    return ok(res, "Product created successfully", product);
  } catch (error: any) {
    return badRequest(res, error.message);
  }
};

/* =========================================================
   UPDATE PRODUCT
========================================================= */
export const updateProductController = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return badRequest(res, "Product ID is required");
    }

    const product = await updateProductService(id, req.body);
    return ok(res, "Product updated successfully", product);
  } catch (error: any) {
    return badRequest(res, error.message);
  }
};

/* =========================================================
   PRODUCT LIST
========================================================= */
export const productListController = async (
  req: Request<{}, {}, {}, any>,
  res: Response,
) => {
  try {
    const result = await getProductListService(req.query);

    return ok(
      res,
      "Products fetched successfully",
      result.products,
      result.pagination?.total,
    );
  } catch (error: any) {
    return serverError(res, error.message);
  }
};

/* =========================================================
   GET PRODUCT BY ID
========================================================= */
export const getProductByIdController = async (
  req: Request<{ productId: string }>,
  res: Response,
) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return badRequest(res, "Product ID is required");
    }

    const product = await getProductByIdService(productId);

    return ok(res, "Product fetched successfully", product);
  } catch (error: any) {
    if (error.message === "Product not found") {
      return notFound(res, error.message);
    }

    return serverError(res, error.message);
  }
};

export const getFeaturedProductsController = async (
  req: Request<{}, {}, {}, any>,
  res: Response,
) => {
  try {
    const userId = (req as any).user?.id;

    const result = await getFeaturedProductsService(req.query, userId);

    return ok(
      res,
      "Featured products fetched successfully",
      result.products,
      result.pagination.total,
    );
  } catch (error: any) {
    return serverError(res, error.message);
  }
};
/* =========================================================
   GET FEATURED PRODUCT BY ID
========================================================= */
export const getFeaturedProductByIdController = async (
  req: Request<{ productId: string }>,
  res: Response,
) => {
  try {
    const { productId } = req.params;

    if (!productId) {
      return badRequest(res, "Product ID is required");
    }

    const userId = (req as any).user?._id;

    const product = await getFeaturedProductByIdService(productId, userId);

    return ok(res, "Featured product details fetched successfully", product);
  } catch (error: any) {
    if (error.message === "Invalid product ID") {
      return badRequest(res, error.message);
    }

    if (error.message === "Featured product not found") {
      return notFound(res, error.message);
    }

    return serverError(res, error.message);
  }
};

/* =========================================================
   CREATE INTEREST LEAD (OPTIONAL)
========================================================= */
// export const createInterestedLeadController = async (
//   req: Request,
//   res: Response,
// ) => {
//   try {
//     const userId = req.user?._id;

//     if (!userId) {
//       return badRequest(res, "Unauthorized");
//     }

//     const lead = await createInterestedLeadService(
//       userId,
//       req.body.productId,
//       req.body.quantity ?? 1,
//     );

//     return ok(res, "Interest recorded successfully", lead);
//   } catch (error: any) {
//     return badRequest(res, error.message);
//   }
// };
