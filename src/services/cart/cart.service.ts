import mongoose, { Types } from "mongoose";
import { Cart } from "../../models/cart/cart.models";

export interface ICartItem {
  serviceId: Types.ObjectId;
  name: string;
  serviceType: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  attributes: {
    type: string;
    subType?: string;
    variant?: string;
  };
}

/**
 * 🔍 Find category index
 */
const findCategoryIndex = (services: any[], category: string) => {
  return services.findIndex((s) => s.category === category);
};

/**
 * 🔍 Find matching item inside category
 */
const findMatchingItemIndex = (items: any[], payload: any) => {
  return items.findIndex((item) => {
    return (
      item.serviceId.toString() === payload.serviceId &&
      item.attributes?.type === payload.type &&
      item.attributes?.subType === payload.subType &&
      item.attributes?.variant === payload.variant
    );
  });
};

/**
 * ➕ ADD TO CART
 */
export const addToCartService = async (userId: string, payload: any) => {
  const {
    serviceId,
    name,
    serviceType,
    category,
    quantity = 1,
    unitPrice,
    type,
    subType,
    variant,
    addressId,
    slot,
    date,
  } = payload;

  let cart = await Cart.findOne({ userId, isActive: true });

  if (!cart) {
    cart = new Cart({
      userId,
      services: [],
    });
  }

  // 🔹 Find or create category
  let categoryIndex = findCategoryIndex(cart.services, category);

  if (categoryIndex === -1) {
    cart.services.push({
      category,
      items: [],
    });
    categoryIndex = cart.services.length - 1;
  }

  const categoryGroup = cart.services[categoryIndex];

  if (!categoryGroup) {
    throw new Error("Category group not found");
  }

  // 🔹 Find item
  const itemIndex = findMatchingItemIndex(categoryGroup.items, payload);

  if (itemIndex > -1) {
    const item = categoryGroup.items[itemIndex];

    if (!item) throw new Error("Item not found");

    item.quantity += quantity;
  } else {
    categoryGroup.items.push({
      serviceId: new Types.ObjectId(serviceId),
      name,
      serviceType,
      quantity,
      unitPrice,
      attributes: {
        type,
        subType,
        variant,
      },
    });
  }
  // 🔹 Optional fields
  if (addressId) cart.addressId = addressId;
  if (slot) cart.slot = slot;
  if (date) cart.date = date;

  await cart.save(); // 🔥 pre-save calculates totals

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
  },
) => {
  const cart = await Cart.findOne({ userId, isActive: true });

  if (!cart) throw new Error("Cart not found");

  let foundItem: any = null;

  // 🔹 Loop categories
  cart.services.forEach((service: any) => {
    const item = service.items.id(cartItemId);
    if (item) foundItem = item;
  });

  if (!foundItem) throw new Error("Item not found");

  if (payload.quantity !== undefined) {
    foundItem.quantity = payload.quantity;
  }

  if (payload.type || payload.subType || payload.variant) {
    foundItem.attributes = {
      ...foundItem.attributes,
      ...(payload.type && { type: payload.type }),
      ...(payload.subType && { subType: payload.subType }),
      ...(payload.variant && { variant: payload.variant }),
    };
  }

  await cart.save();

  return cart;
};

/**
 * ❌ REMOVE CART ITEM
 */
export const removeCartItemService = async (
  userId: string,
  cartItemId: string,
) => {
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
 * 🛒 GET CART
 */
export const getCartService = async (userId: string) => {
  const cart = await Cart.findOne({ userId, isActive: true }).lean();

  if (!cart) {
    return {
      services: [],
      itemTotal: 0,
      discount: 0,
      tax: {
        vatRate: 0,
        vatAmount: 0,
      },
      grandTotal: 0,
    };
  }

  return cart;
};
