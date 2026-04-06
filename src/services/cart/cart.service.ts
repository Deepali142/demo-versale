// src/services/cart/cart.service.ts
import { Types } from "mongoose";
import { Cart } from "../../models/cart/cart.models";
import { CartSubType, ICartItem } from "../../types/cart.types";

/**
 * 🔥 ADD TO CART PAYLOAD
 */
export interface AddToCartPayload {
  type: "BOOKING" | "QUOTE_REQUEST";
  subType?: string;

  serviceId?: string; // only for BOOKING

  name: string;
  category: "AC" | "Boiler" | "Heat Pump";

  quantity?: number;
  unitPrice?: number;

  attributes: {
    categoryType: string;
    subType?: string;
    variant?: string;
  };

  meta?: {
    brand?: string;
    model?: string;
    age?: string;
    condition?: string;
    issue?: string;
    planType?: string;
  };

  addressId?: string;
  slot?: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
  date?: string;
}

/**
 * FIND CATEGORY INDEX
 */
function findCategoryIndex(services: any[], category: string) {
  return services.findIndex((s) => s.category === category);
}

function findMatchingItemIndex(items: ICartItem[], payload: AddToCartPayload) {
  return items.findIndex((i) => {
    if (payload.type === "BOOKING") {
      return (
        i.type === "BOOKING" &&
        i.serviceId?.toString() === payload.serviceId &&
        i.attributes?.variant === payload.attributes?.variant
      );
    }

    if (payload.type === "QUOTE_REQUEST") {
      if (payload.subType === "OLD_AC") {
        return (
          i.subType === "OLD_AC" &&
          i.meta?.brand === payload.meta?.brand &&
          i.meta?.model === payload.meta?.model
        );
      }
      if (payload.subType === "AMC") {
        return (
          i.subType === "AMC" && i.meta?.planType === payload.meta?.planType
        );
      }
      return i.subType === payload.subType;
    }

    return false;
  });
}

export const addToCartService = async (
  userId: string,
  payload: AddToCartPayload,
) => {
  let cart = await Cart.findOne({ userId, isActive: true });
  cart ??= new Cart({ userId: new Types.ObjectId(userId) });

  const validSubTypes: CartSubType[] = [
    "INSTALLATION",
    "REPAIR",
    "SERVICE",
    "COMPRESSOR",
    "GAS_CHARGING",
    "COPPER_PIPING",
    "AMC",
    "OLD_AC",
    "OTHER",
    "PURCHASE_LEAD",
    "FREE_CONSULTATION",
  ];

  let subType: CartSubType | undefined;
  if (payload.subType) {
    const normalized = payload.subType.trim().toUpperCase();
    if (!validSubTypes.includes(normalized as CartSubType))
      throw new Error("Invalid subType");
    subType = normalized as CartSubType;
  }

  const quantity = payload.quantity ?? 1;
  const unitPrice = payload.type === "BOOKING" ? (payload.unitPrice ?? 0) : 0;

  const newItem: ICartItem = {
    type: payload.type,
    ...(subType && { subType }),
    ...(payload.type === "BOOKING" && payload.serviceId
      ? { serviceId: new Types.ObjectId(payload.serviceId) }
      : {}),
    name: payload.name,
    quantity,
    unitPrice,
    totalPrice: quantity * unitPrice,
    attributes: {
      categoryType: payload.attributes.categoryType,
      ...(payload.attributes.subType && {
        subType: payload.attributes.subType,
      }),
      ...(payload.attributes.variant && {
        variant: payload.attributes.variant,
      }),
    },
    ...(payload.type === "QUOTE_REQUEST" &&
      payload.meta && { meta: payload.meta }),
  };

  if (payload.type === "BOOKING") {
    // BOOKING → services array
    let categoryIndex = cart.services.findIndex(
      (s) => s.category === payload.category,
    );
    if (categoryIndex === -1) {
      cart.services.push({ category: payload.category, items: [] });
      categoryIndex = cart.services.length - 1;
    }
    cart.services[categoryIndex]!.items.push(newItem);
  } else {
    // QUOTE_REQUEST → quoteRequests array
    cart.quoteRequests.push(newItem);
  }

  // Optional fields
  if (payload.addressId) cart.addressId = new Types.ObjectId(payload.addressId);
  if (payload.slot) cart.slot = payload.slot;
  if (payload.date) {
    const d = new Date(payload.date);
    if (!isNaN(d.getTime())) cart.date = d;
  }

  await cart.save();
  return cart;
};

/**
 * UPDATE CART ITEM (supports both services & quoteRequests)
 */
export const updateCartItemService = async (
  userId: string,
  cartItemId: string,
  payload: {
    quantity?: number;
    categoryType?: string;
    subType?: string;
    variant?: string;
    meta?: Record<string, any>;
  },
) => {
  const cart = await Cart.findOne({ userId, isActive: true });
  if (!cart) throw new Error("Cart not found");

  let foundItem: ICartItem | null = null;

  // 1️⃣ Search in services
  for (const service of cart.services) {
    const item = (service.items as any).id(cartItemId);
    if (item) {
      foundItem = item;
      break;
    }
  }

  // 2️⃣ If not found, search in quoteRequests
  if (!foundItem) {
    const item = (cart.quoteRequests as any).id(cartItemId);
    if (item) {
      foundItem = item;
    }
  }

  if (!foundItem) throw new Error("Item not found");

  // 3️⃣ Update quantity
  if (payload.quantity !== undefined) {
    if (payload.quantity <= 0) throw new Error("Quantity must be > 0");
    foundItem.quantity = payload.quantity;
  }

  // 4️⃣ Validate subType if provided
  const validSubTypes: CartSubType[] = [
    "INSTALLATION",
    "REPAIR",
    "SERVICE",
    "COMPRESSOR",
    "GAS_CHARGING",
    "COPPER_PIPING",
    "AMC",
    "OLD_AC",
    "OTHER",
    "PURCHASE_LEAD",
    "FREE_CONSULTATION",
  ];

  let subType: CartSubType | undefined;
  if (payload.subType) {
    if (!validSubTypes.includes(payload.subType as CartSubType))
      throw new Error("Invalid subType");
    subType = payload.subType as CartSubType;
  }

  // 5️⃣ Update attributes
  if (payload.categoryType || subType || payload.variant) {
    foundItem.attributes = {
      ...foundItem.attributes,
      ...(payload.categoryType && { categoryType: payload.categoryType }),
      ...(subType && { subType }),
      ...(payload.variant && { variant: payload.variant }),
    };
  }

  // 6️⃣ Update meta
  if (payload.meta) {
    foundItem.meta = { ...foundItem.meta, ...payload.meta };
  }

  // 7️⃣ Recalculate totalPrice
  foundItem.totalPrice = (foundItem.quantity ?? 0) * (foundItem.unitPrice ?? 0);

  // 8️⃣ Save cart
  await cart.save();
  return cart;
};

export const removeCartItemService = async (
  userId: string,
  cartItemId: string,
) => {
  const cart = await Cart.findOne({ userId, isActive: true });
  if (!cart) throw new Error("Cart not found");

  let removed = false;

  cart.services = cart.services.filter((service: any) => {
    const originalLength = service.items.length;
    service.items = service.items.filter(
      (item: any) => item._id.toString() !== cartItemId,
    );
    if (service.items.length < originalLength) removed = true;

    return service.items.length > 0;
  });

  if (!removed) throw new Error("Item not found");

  await cart.save();
  return cart;
};

/**
 * GET CART
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
