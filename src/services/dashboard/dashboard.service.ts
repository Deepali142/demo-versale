import mongoose, { FilterQuery } from "mongoose";
import {
  DashboardItem,
  IDashboardItem,
} from "../../models/dashboard/dashboard.model";

// --------------------
// TYPES
// --------------------
type AppType = "USER" | "TECHNICIAN";

interface GetDashboardParams {
  appType?: AppType;
  screen?: string;
}

export interface DashboardSectionResponse {
  section: string;
  title: string;
  items: IDashboardItem[];
  screens?: string[]; 
}

// --------------------
// GET DASHBOARD (GROUPED)
export const getDashboardItemsService = async ({
  appType,
  screen,
}: GetDashboardParams): Promise<DashboardSectionResponse[]> => {
  const matchStage: any = {
    isActive: true,
    screen, 
  };

  if (appType) matchStage.appType = appType;

  const aggregation = await DashboardItem.aggregate([
    { $match: matchStage },
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
    {
      $project: {
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
      },
    },
    { $sort: { position: 1 } },
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
    {
      $project: {
        _id: 0,
        section: "$_id",
        title: 1,
        items: 1,
      },
    },

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

  return aggregation as DashboardSectionResponse[];
};

// --------------------
// CREATE
// --------------------
export const createDashboardItemService = async (payload: {
  name: string;
  iconUrl: string;
  section: "QUICK_SERVICES" | "BOOKING" | "OTHER" | "REQUEST" | "UTILITIES";
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
    appType: payload.appType,
    position: payload.position,

    screen: payload.screen || "HOME",

    ...(payload.sectionTitle && { sectionTitle: payload.sectionTitle }),

    ...(payload.parentId && { parentId: payload.parentId }),

    ...(payload.serviceId && { serviceId: payload.serviceId }),

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
    section:
      | "QUICK_SERVICES"
      | "BOOKING"
      | "OTHER"
      | "REQUEST"
      | "UTILITIES";
    sectionTitle: string;
    appType: AppType;
    position: number;

    // 🔥 NEW FIELDS
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

  if (payload.serviceId) {
    payload.serviceId = new mongoose.Types.ObjectId(payload.serviceId) as any;
  }

  if (payload.parentId) {
    payload.parentId = new mongoose.Types.ObjectId(payload.parentId) as any;
  }

  const cleanedPayload = Object.fromEntries(
    Object.entries(payload).filter(([_, v]) => v !== undefined)
  );

  return DashboardItem.findByIdAndUpdate(
    id,
    { $set: cleanedPayload },
    {
      new: true,
      runValidators: true,
    }
  );
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
