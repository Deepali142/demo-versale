// src/services/cart/cart.service.ts
import { Types } from "mongoose";
import { Cart } from "../../models/cart/cart.models";
import { CartSubType, ICartItem } from "../../types/cart.types";
import { createEnquiryService } from "../enquiry/enquiry.service";
import { ICreateEnquiryPayload, IUserContext } from "../../types/enquiry.types";
import User from "../../models/user/user.model";
import Lead from "../../models/leads/leads.model";
import { Consultancy } from "../../models/consultancy/consultancy.model";
import { OldAcEnquiryDetail } from "../../models/enquiry/oldac.model";
import Enquiry from "../../models/enquiry/enquiry.model";
import { Booking } from "../../models/booking/booking.model";
import Address from "../../models/user/address.model";
const normalizeServiceType = (
  type?: string,
): "Sterilization" | "Repair" | "Installation" => {
  const validTypes = ["Sterilization", "Repair", "Installation"];

  if (type && validTypes.includes(type)) {
    return type as "Sterilization" | "Repair" | "Installation";
  }

  return "Repair"; // default fallback
};

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

  let findUser = await User.findById(userId);

  const validSubTypes: CartSubType[] = [
    "INSTALLATION",
    "REPAIR",
    "STERILIZATION",
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
    name: findUser && findUser.name ? findUser.name : "",
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
    action?: "INCREMENT" | "DECREMENT";
    categoryType?: string;
    subType?: string;
    variant?: string;
    meta?: Record<string, any>;
  },
) => {
  const cart = await Cart.findOne({ userId, isActive: true });
  if (!cart) throw new Error("Cart not found");

  let foundItem: any = null;
  let isFromService = false;

  for (const service of cart.services) {
    const item = (service.items as any).id(cartItemId);
    if (item) {
      foundItem = item;
      isFromService = true;
      break;
    }
  }

  if (!foundItem) {
    const item = (cart.quoteRequests as any).id(cartItemId);
    if (item) {
      foundItem = item;
    }
  }

  if (!foundItem) throw new Error("Item not found");

  if (payload.action) {
    if (payload.action === "INCREMENT") {
      foundItem.quantity = (foundItem.quantity || 0) + 1;
    }

    if (payload.action === "DECREMENT") {
      if (foundItem.quantity > 1) {
        foundItem.quantity -= 1;
      } else {
        if (isFromService) {
          cart.services = cart.services
            .map((service: any) => {
              service.items = service.items.filter(
                (item: any) => item._id.toString() !== cartItemId,
              );
              return service.items.length ? service : null;
            })
            .filter(Boolean);
        } else {
          cart.quoteRequests = cart.quoteRequests.filter(
            (item: any) => item._id.toString() !== cartItemId,
          );
        }

        await cart.save();
        return cart;
      }
    }
  }

  const validSubTypes = [
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

  let subType;
  if (payload.subType) {
    if (!validSubTypes.includes(payload.subType))
      throw new Error("Invalid subType");
    subType = payload.subType;
  }

  if (payload.categoryType || subType || payload.variant) {
    foundItem.attributes = {
      ...foundItem.attributes,
      ...(payload.categoryType && { categoryType: payload.categoryType }),
      ...(subType && { subType }),
      ...(payload.variant && { variant: payload.variant }),
    };
  }

  if (payload.meta) {
    foundItem.meta = {
      ...foundItem.meta,
      ...payload.meta,
    };
  }

  foundItem.totalPrice = (foundItem.quantity ?? 0) * (foundItem.unitPrice ?? 0);

  cart.services = cart.services.filter(
    (service: any) => service.items.length > 0,
  );

  await cart.save();
  return cart;
};

export const removeCartItemService = async (
  userId: string,
  cartItemId: string,
) => {
  const cart = await Cart.findOne({ userId, isActive: true });
  if (!cart) throw new Error("Cart not found");

  let found = false;

  cart.services = cart.services
    .map((service: any) => {
      service.items = service.items
        .map((item: any) => {
          if (item._id.toString() === cartItemId) {
            found = true;

            if (item.quantity > 1) {
              item.quantity -= 1;
              return item;
            }

            return null;
          }
          return item;
        })
        .filter(Boolean);

      return service.items.length > 0 ? service : null;
    })
    .filter(Boolean);

  if (!found) throw new Error("Item not found");

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

export const checkoutService = async (
  userId: string,
  payload: {
    addressId: string;
    slot?: "FIRST_HALF" | "SECOND_HALF" | "FULL_DAY";
    date?: string;
  },
) => {
  const cart = await Cart.findOne({ userId, isActive: true });

  if (!cart || (!cart.services?.length && !cart.quoteRequests?.length)) {
    throw new Error("Cart is empty");
  }

  const bookingItems =
    cart.services?.flatMap((service) => service.items || []) || [];
  const quoteItems = cart.quoteRequests.filter(
    (i: any) => i.type === "QUOTE_REQUEST",
  );

  const address = await Address.findById(payload.addressId);
  if (!address) throw new Error("Address not found");

  const addressDetails = {
    house: address.house,
    street: address.street,
    city: address.city,
    state: address.state,
    zipcode: address.zipcode,
    landmark: address.landmark,
    saveAs: address.saveAs,
  };

  let result: any = {
    booking: null,
    enquiries: [],
  };

  // =========================
  // ✅ 1. BOOKING FLOW
  // =========================
  if (bookingItems.length) {
    const bookingEnquiry = await Enquiry.create({
      user_id: userId,
      type: "BOOKING",
      subType: bookingItems[0]?.subType,
      addressDetails,
      schedule: {
        slot: payload.slot,
        date: payload.date,
      },
    });

    const categoryMap = new Map();

    bookingItems.forEach((item: any) => {
      if (!categoryMap.has(item.category)) {
        categoryMap.set(item.category, {
          category: item.category,
          items: [],
        });
      }

      categoryMap.get(item.category).items.push({
        serviceId: item.serviceId,
        name: item.name,
        serviceType: item.serviceType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        attributes: {
          type: item.attributes?.categoryType,
          subType: item.attributes?.subType,
          variant: item.attributes?.variant,
        },
      });
    });

    const booking = await Booking.create({
      user_id: userId,
      bookingId: `BK-${Date.now()}`,
      services: Array.from(categoryMap.values()),
      address: addressDetails,
      slot: payload.slot,
      date: payload.date,
      enquiryId: bookingEnquiry._id,
    });

    bookingEnquiry.bookingId = booking._id;
    bookingEnquiry.status = "BOOKING_CREATED";
    await bookingEnquiry.save();

    result.booking = booking;
    result.enquiries.push(bookingEnquiry);
  }

  const subTypeMap = new Map<string, any[]>();

  quoteItems.forEach((item: any) => {
    if (!subTypeMap.has(item.subType)) {
      subTypeMap.set(item.subType, []);
    }

    const list = subTypeMap.get(item.subType)!;
    list.push(item);
  });

  for (const [subType, items] of subTypeMap.entries()) {
    const enquiry = await Enquiry.create({
      user_id: userId,
      type: "QUOTE_REQUEST",
      subType,
      addressDetails,
      status: "REQUESTED",
    });

    if (subType === "OLD_AC") {
      const oldAcDetails = items.map((item: any) => ({
        brand: item.meta?.brand,
        model: item.meta?.model,
        acType: item.meta?.acType,
        tonnage: item.meta?.tonnage,
        age: item.meta?.age,
        condition: item.meta?.condition,
        technology: item.meta?.technology,
        photos: item.meta?.photos || [],
      }));

      await OldAcEnquiryDetail.create({
        enquiryId: enquiry._id,
        oldAcDetails,
      });
    }

    if (subType === "FREE_CONSULTATION") {
      const item = items[0];

      await Consultancy.create({
        user_id: userId,
        enquiryId: enquiry._id,
        brandId: item.meta?.brandId,
        quantity: item.quantity?.toString() || "1",
        comment: item.meta?.comment,
        place: item.meta?.place,
        consultancyId: `CONS-${Date.now()}`,
        serviceName: item.meta?.serviceName || [],
        addressDetails,
        slot: payload.slot,
        date: payload.date,
        alternatePhone: item.meta?.alternatePhone,
      });
    }

    if (subType === "AMC" || subType === "PURCHASE_LEAD") {
      const item = items[0];

      await Lead.create({
        user_id: userId,
        enquiryId: enquiry._id,
        leadId: `LEAD-${Date.now()}`,
        place: item.meta?.place,
        quantity: item.quantity,
        comment: item.meta?.comment,
        username: item.meta?.username,
        phoneNumber: item.meta?.phoneNumber,
        address: `${address.street}, ${address.city}`,
        acDetails: item.meta?.acDetails || [],
      });
    }

    result.enquiries.push(enquiry);
  }

  cart.services = [];
  cart.quoteRequests = [];
  cart.isActive = false;
  await cart.save();

  return result;
};
