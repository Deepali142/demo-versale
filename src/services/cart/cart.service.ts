// src/services/cart/cart.service.ts
import { Types } from "mongoose";
import { Cart } from "../../models/cart/cart.models";
import { ICartItem } from "../../types/cart.types";

/** Payload for adding a single item to cart */
export interface AddToCartPayload {
  serviceId: string;
  name: string;
  serviceType: "Sterilization" | "Repair" | "Installation";
  category: "AC" | "Boiler" | "Heat Pump";
  quantity?: number;
  unitPrice: number;
  type: string; // required by schema
  subType?: string;
  variant?: string;
  addressId?: string;
  slot?: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
  date?: string;
}
export interface ICartItemAttributes {
  type: string;
  subType?: string;
  variant?: string;
}
// Helper functions
function findCategoryIndex(services: any[], category: string) {
  return services.findIndex((s) => s.category === category);
}

function findMatchingItemIndex(items: ICartItem[], payload: AddToCartPayload) {
  return items.findIndex(
    (i) =>
      i.serviceId.toString() === payload.serviceId &&
      (i.attributes?.variant || "") === (payload.variant || "")
  );
}

export const addToCartService = async (userId: string, payload: AddToCartPayload) => {
  let cart = await Cart.findOne({ userId, isActive: true });
  cart ??= new Cart({
      userId: new Types.ObjectId(userId),
      services: [],
    });

  let categoryIndex = findCategoryIndex(cart.services, payload.category);
  if (categoryIndex === -1) {
    cart.services.push({ category: payload.category, items: [] });
    categoryIndex = cart.services.length - 1;
  }

  const categoryGroup = cart.services[categoryIndex];
  if (!categoryGroup) {
    throw new Error("Category group not found after creation"); 
  }

  const itemIndex = findMatchingItemIndex(categoryGroup.items, payload);

  if (itemIndex > -1) {
    const item = categoryGroup.items[itemIndex];
    if (!item) throw new Error("Cart item not found"); 
    item.quantity += payload.quantity ?? 1;
    item.unitPrice = payload.unitPrice;
    item.totalPrice = item.quantity * item.unitPrice;
  } else {
    // Add new item
    const quantity = payload.quantity ?? 1;
    categoryGroup.items.push({
      serviceId: new Types.ObjectId(payload.serviceId),
      name: payload.name,
      serviceType: payload.serviceType,
      quantity,
      unitPrice: payload.unitPrice,
      totalPrice: quantity * payload.unitPrice,
      attributes: {
  type: payload.type,
  ...(payload.subType !== undefined && { subType: payload.subType }),
  ...(payload.variant !== undefined && { variant: payload.variant }),
} as ICartItemAttributes
    });
  }

  // 5️⃣ Optional cart-level fields
  if (payload.addressId) cart.addressId = new Types.ObjectId(payload.addressId);
  if (payload.slot) cart.slot = payload.slot;
  if (payload.date) {
    const parsedDate = new Date(payload.date);
    if (!isNaN(parsedDate.getTime())) cart.date = parsedDate;
  }

  // 6️⃣ Save cart
  await cart.save();

  return cart;
};
/**
 * ✏️ UPDATE CART ITEM
 */
export const updateCartItemService = async (
  userId: string,
  cartItemId: string,
  payload: {
    quantity?: number;
    type?: string;
    subType?: string;
    variant?: string;
  }
) => {
  const cart = await Cart.findOne({ userId, isActive: true });
  if (!cart) throw new Error("Cart not found");

  let foundItem: any = null;

  cart.services.forEach((service: any) => {
    const item = service.items.id(cartItemId);
    if (item) foundItem = item;
  });

  if (!foundItem) throw new Error("Item not found");

  if (payload.quantity !== undefined) foundItem.quantity = payload.quantity;

  if (payload.type || payload.subType || payload.variant) {
    foundItem.attributes = {
      ...foundItem.attributes,
      ...(payload.type && { type: payload.type }),
      ...(payload.subType && { subType: payload.subType }),
      ...(payload.variant && { variant: payload.variant }),
    };
  }

  // Recalculate totalPrice
  foundItem.totalPrice = foundItem.quantity * foundItem.unitPrice;

  await cart.save();
  return cart;
};

/**
 * REMOVE CART ITEM
 */
export const removeCartItemService = async (userId: string, cartItemId: string) => {
  const cart = await Cart.findOne({ userId, isActive: true });
  if (!cart) throw new Error("Cart not found");

  let isRemoved = false;

  cart.services.forEach((service: any) => {
    const item = service.items.id(cartItemId);
    if (item) {
      item.deleteOne();
      isRemoved = true;
    }
  });

  if (!isRemoved) throw new Error("Item not found");

  await cart.save();
  return cart;
};

/**
 * 🛒 GET USER CART
 */
export const getCartService = async (userId: string) => {
  const cart = await Cart.findOne({ userId, isActive: true }).lean();
  if (!cart) {
    return {
      services: [],
      itemTotal: 0,
      discount: 0,
      tax: { vatRate: 0, vatAmount: 0 },
      grandTotal: 0,
    };
  }
  return cart;
};