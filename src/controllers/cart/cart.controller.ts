// src/controllers/cart/cart.controller.ts
import { Request, Response } from "express";
import {
  addToCartService,
  getCartService,
  updateCartItemService,
  removeCartItemService,
  AddToCartPayload,
} from "../../services/cart/cart.service";

/**
 * ➕ ADD TO CART
 */
export const addToCartController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      itemType,
      type,
      subType,
      serviceId,
      name,
      serviceType,
      quantity,
      unitPrice,
      attributes,
      category,
      meta,
      addressId,
      slot,
      date,
    } = req.body;

    // Basic validation
    if (!type || !name || !category || !attributes?.categoryType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, name, category, attributes.categoryType",
      });
    }

    // Service validation
    if (itemType === "SERVICE") {
      if (!serviceId || !serviceType || unitPrice === undefined) {
        return res.status(400).json({
          success: false,
          message: "SERVICE requires: serviceId, serviceType, unitPrice",
        });
      }
    }

    // OLD_AC validation
    if (itemType === "OLD_AC") {
      if (!meta?.brand && !meta?.model) {
        return res.status(400).json({
          success: false,
          message: "OLD_AC requires at least brand or model",
        });
      }
    }

    // Build payload
    const payload: AddToCartPayload = {
      type,
      ...(type === "BOOKING" && serviceId ? { serviceId, unitPrice } : {}),
      ...(subType && { subType }),
      name,
      category,
      quantity,
      attributes: {
        categoryType: attributes.categoryType,
        ...(attributes.subType && { subType: attributes.subType }),
        ...(attributes.variant && { variant: attributes.variant }),
      },
      ...(type === "QUOTE_REQUEST" && meta ? { meta } : {}),
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

/**
 * 📦 GET CART
 */
export const getCartController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const cart = await getCartService(userId);

    return res.status(200).json({ success: true, data: cart });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cart",
    });
  }
};

/**
 * ✏️ UPDATE CART ITEM
 */
export const updateCartItemController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id?.toString();
    const { cartItemId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!cartItemId) return res.status(400).json({ success: false, message: "cartItemId is required" });

    if (req.body.quantity !== undefined && req.body.quantity <= 0) {
      return res.status(400).json({ success: false, message: "Quantity must be greater than 0" });
    }

    const cart = await updateCartItemService(userId, cartItemId, req.body);

    return res.status(200).json({ success: true, message: "Cart item updated", data: cart });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update cart item",
    });
  }
};

/**
 * ❌ REMOVE CART ITEM
 */
export const removeCartItemController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id?.toString();
    const { cartItemId } = req.params;

    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!cartItemId) return res.status(400).json({ success: false, message: "cartItemId is required" });

    const cart = await removeCartItemService(userId, cartItemId);

    return res.status(200).json({ success: true, message: "Item removed from cart", data: cart });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove item",
    });
  }
};

export const getMyCartController = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const userId = req.user?.id?.toString();
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const cart = await getCartService(userId);

    return res.status(200).json({ success: true, message: "Cart fetched successfully", data: cart });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch cart",
    });
  }
};