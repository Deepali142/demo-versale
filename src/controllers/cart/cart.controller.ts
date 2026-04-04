import { Request, Response } from "express";
import {
  addToCartService,
  getCartService,
  updateCartItemService,
  removeCartItemService,
  AddToCartPayload,
} from "../../services/cart/cart.service";

export const addToCartController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?._id?.toString();

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const {
      serviceId,
      name,
      serviceType,
      quantity,
      unitPrice,
      attributes,
      category,
      addressId,
      slot,
      date,
    } = req.body;

    if (!serviceId || !name || !serviceType || !unitPrice || !category || !attributes?.type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: serviceId, name, serviceType, unitPrice, category, or attributes.type",
      });
    }

    const payload: AddToCartPayload = {
      serviceId,
      name,
      serviceType,
      quantity,
      unitPrice,
      type: attributes.type,
      ...(attributes.subType && { subType: attributes.subType }),
      ...(attributes.variant && { variant: attributes.variant }),
      category,
      ...(addressId && { addressId }),
      ...(slot && { slot }),
      ...(date && { date }),
    };

    const cart = await addToCartService(userId, payload);

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add to cart",
    });
  }
};
export const getCartController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cart = await getCartService(userId);

    return res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cart",
    });
  }
};

/**
 *  UPDATE CART ITEM
 */
export const updateCartItemController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;
    const { cartItemId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }

    const cart = await updateCartItemService(
      userId,
      cartItemId,
      req.body,
    );

    return res.status(200).json({
      success: true,
      message: "Cart item updated",
      data: cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update cart item",
    });
  }
};

export const removeCartItemController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;
    const { cartItemId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!cartItemId) {
      return res.status(400).json({
        success: false,
        message: "cartItemId is required",
      });
    }

    const cart = await removeCartItemService(userId, cartItemId);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove item",
    });
  }
};

export const getMyCartController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const cart = await getCartService(userId);

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully",
      data: cart,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cart",
    });
  }
};