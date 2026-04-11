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

export interface DashboardSectionResponse {
  section: SectionType;
  title: string;
  items: DashboardItemResponse[];
  order?: number;
}

export const getDashboardItemsService = async ({
  appType,
  screen,
}: GetDashboardParams): Promise<DashboardSectionResponse[]> => {
  const matchStage: Record<string, any> = {
    isActive: true,
  };

  if (appType) matchStage.appType = appType;
  if (screen) matchStage.screen = screen;

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
        parentId: { $ifNull: ["$parentId", null] },
        service: {
          $cond: [
            { $ifNull: ["$service._id", false] },
            {
              _id: "$service._id",
              name: "$service.name",
              unitPrice: "$service.unitPrice",
            },
            null,
          ],
        },
      },
    },

    { $sort: { position: 1 } },

    {
      $group: {
        _id: "$section",
        sectionTitle: {
          $first: { $ifNull: ["$sectionTitle", "$section"] },
        },
        items: { $push: "$$ROOT" },
      },
    },

    {
      $project: {
        section: "$_id",
        sectionTitle: 1,

        parents: {
          $filter: {
            input: "$items",
            as: "item",
            cond: { $eq: ["$$item.parentId", null] },
          },
        },

        children: {
          $filter: {
            input: "$items",
            as: "item",
            cond: { $ne: ["$$item.parentId", null] },
          },
        },
      },
    },

    {
      $project: {
        section: 1,
        title: "$sectionTitle",

        items: {
          $map: {
            input: "$parents",
            as: "parent",
            in: {
              _id: "$$parent._id",
              name: "$$parent.name",
              iconUrl: "$$parent.iconUrl",
              position: "$$parent.position",
              actionType: "$$parent.actionType",
              actionValue: "$$parent.actionValue",
              service: "$$parent.service",

              children: {
                $map: {
                  input: {
                    $filter: {
                      input: "$children",
                      as: "child",
                      cond: {
                        $eq: [
                          { $toString: "$$child.parentId" },
                          { $toString: "$$parent._id" },
                        ],
                      },
                    },
                  },
                  as: "child",
                  in: {
                    _id: "$$child._id",
                    name: "$$child.name",
                    iconUrl: "$$child.iconUrl",
                    position: "$$child.position",
                    actionType: "$$child.actionType",
                    actionValue: "$$child.actionValue",
                    service: "$$child.service",
                  },
                },
              },
            },
          },
        },
      },
    },
  ]);

  return aggregation;
};


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
  }>,
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
