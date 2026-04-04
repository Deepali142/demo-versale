import mongoose from "mongoose";
import {
  DashboardItem,
  IDashboardItem,
} from "../../models/dashboard/dashboard.model";

import { SECTION, SectionType } from "../../types/section.types";

const data: Record<SectionType, any> = {
  SERVICE_TYPES: { title: "Services", items: [] },
  BOOKING: { title: "Booking", items: [] },
  REQUEST: { title: "Request", items: [] },
  UTILITIES: { title: "Utilities", items: [] },
  TOP_BANNER: null,
  MIDDLE_BANNER: null,
  BOTTOM_BANNER: null,
  PRODUCT_LIST: [],
  STERILIZATION_INFO: [],
};
// --------------------
// TYPES
// --------------------

export type AppType = "USER" | "TECHNICIAN";

interface GetDashboardParams {
  appType?: AppType;
  screen?: string;
}

export interface DashboardItemResponse {
  _id: mongoose.Types.ObjectId;
  name: string;
  iconUrl: string;
  position: number;
  actionType?: "SERVICE" | "NAVIGATE" | "API";
  actionValue?: string;
  service?: {
    _id: mongoose.Types.ObjectId;
    name: string;
    unitPrice: number;
    category: string;
  } | null;
  screen?: string;
}

// ✅ Section Response
export interface DashboardSectionResponse {
  section: SectionType;
  title: string;
  items: DashboardItemResponse[];
  order?: number;
}

// --------------------
// GET DASHBOARD (GROUPED)
// --------------------

export const getDashboardItemsService = async ({
  appType,
  screen,
}: GetDashboardParams): Promise<DashboardSectionResponse[]> => {
  const matchStage: Record<string, any> = {
    isActive: true,
  };

  // ✅ Safe filters
  if (appType) matchStage.appType = appType;
  if (screen) matchStage.screen = screen;

  const aggregation = await DashboardItem.aggregate<DashboardSectionResponse>([
    { $match: matchStage },

    // 🔥 JOIN SERVICE
    {
      $lookup: {
        from: "services",
        localField: "serviceId",
        foreignField: "_id",
        as: "service",
      },
    },
    {
      $unwind: {
        path: "$service",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 🔥 CLEAN SERVICE OBJECT
    {
      $addFields: {
        service: {
          _id: "$service._id",
          name: "$service.name",
          unitPrice: "$service.unitPrice",
          category: "$service.category",
        },
      },
    },

    // 🔥 REMOVE UNUSED FIELDS
    {
      $project: {
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      },
    },

    // 🔥 SORT ITEMS INSIDE SECTION
    { $sort: { position: 1 } },

    // 🔥 GROUP BY SECTION
    {
      $group: {
        _id: "$section",
        title: {
          $first: {
            $ifNull: ["$sectionTitle", "$section"],
          },
        },
        items: {
          $push: {
            _id: "$_id",
            name: "$name",
            iconUrl: "$iconUrl",
            position: "$position",
            actionType: "$actionType",
            actionValue: "$actionValue",
            service: "$service",
            screen: "$screen",
          },
        },
      },
    },

    // 🔥 SHAPE OUTPUT
    {
      $project: {
        _id: 0,
        section: "$_id",
        title: 1,
        items: 1,
      },
    },

    // 🔥 ORDER SECTIONS
    {
      $addFields: {
        order: {
          $switch: {
            branches: [
              { case: { $eq: ["$section", "QUICK_SERVICES"] }, then: 1 },
              { case: { $eq: ["$section", "BOOKING"] }, then: 2 },
              { case: { $eq: ["$section", "REQUEST"] }, then: 3 },
              { case: { $eq: ["$section", "UTILITIES"] }, then: 4 },
              { case: { $eq: ["$section", "OTHER"] }, then: 5 },
            ],
            default: 99,
          },
        },
      },
    },

    { $sort: { order: 1 } },
  ]);

  return aggregation;
};

// --------------------
// CREATE
// --------------------

export const createDashboardItemService = async (payload: {
  name: string;
  iconUrl: string;
  section: SectionType;
  sectionTitle?: string;
  appType: AppType;
  position: number;
  screen?: string;
  parentId?: string;
  serviceId?: string;
  actionType?: "SERVICE" | "NAVIGATE" | "API";
  actionValue?: string;
}): Promise<IDashboardItem> => {
  if (!payload.actionType && !payload.serviceId) {
    throw new Error("Either actionType or serviceId is required");
  }

  const item = new DashboardItem({
    name: payload.name,
    iconUrl: payload.iconUrl,
    section: payload.section,
    sectionTitle: payload.sectionTitle,
    appType: payload.appType,
    position: payload.position,
    screen: payload.screen || "HOME",

    ...(payload.parentId && {
      parentId: new mongoose.Types.ObjectId(payload.parentId),
    }),

    ...(payload.serviceId && {
      serviceId: new mongoose.Types.ObjectId(payload.serviceId),
    }),

    ...(payload.actionType && { actionType: payload.actionType }),
    ...(payload.actionValue && { actionValue: payload.actionValue }),
  });

  return item.save();
};

// --------------------
// UPDATE
// --------------------

export const updateDashboardItemService = async (
  id: string,
  payload: Partial<{
    name: string;
    iconUrl: string;
    section: SectionType;
    sectionTitle: string;
    appType: AppType;
    position: number;
    screen: string;
    parentId: string;
    serviceId: string;
    actionType: "SERVICE" | "NAVIGATE" | "API";
    actionValue: string;
    isActive: boolean;
  }>
): Promise<IDashboardItem | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid dashboard item ID");
  }

  const updateData: Record<string, any> = { ...payload };

  if (payload.serviceId) {
    updateData.serviceId = new mongoose.Types.ObjectId(payload.serviceId);
  }

  if (payload.parentId) {
    updateData.parentId = new mongoose.Types.ObjectId(payload.parentId);
  }

  return DashboardItem.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

// --------------------
// DELETE
// --------------------

export const deleteDashboardItemService = async (
  id: string,
): Promise<IDashboardItem | null> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid dashboard item ID");
  }

  return DashboardItem.findByIdAndDelete(id);
};