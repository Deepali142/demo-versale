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
}

export interface DashboardSectionResponse {
  section: string;
  title: string;
  items: IDashboardItem[];
}

// --------------------
// GET DASHBOARD (GROUPED)
// --------------------
export const getDashboardItemsService = async ({
  appType,
}: GetDashboardParams): Promise<DashboardSectionResponse[]> => {
  const filter: FilterQuery<IDashboardItem> = {
    isActive: true,
    ...(appType && { appType }),
  };

  const items = await DashboardItem.find(filter)
    .sort({ position: 1 })
    .lean<IDashboardItem[]>();

  const grouped: Record<string, DashboardSectionResponse> = {};

  for (const item of items) {
    // ✅ SAFE ACCESS (important)
    const sectionKey = item.section;

    if (!sectionKey) continue; // safety guard

    if (!grouped[sectionKey]) {
      grouped[sectionKey] = {
        section: sectionKey,
        title: item.sectionTitle ?? sectionKey, // ✅ better fallback
        items: [],
      };
    }

    grouped[sectionKey].items.push(item);
  }

  return Object.values(grouped);
};

// --------------------
// CREATE
// --------------------
export const createDashboardItemService = async (payload: {
  name: string;
  iconUrl: string;
  section: "QUICK_SERVICES" | "BOOKING" | "OTHER";
  sectionTitle?: string;
  appType: AppType;
  position: number;
  actionType?: "NAVIGATE" | "API";
  actionValue?: string;
}): Promise<IDashboardItem> => {
  const item = new DashboardItem({
    name: payload.name,
    iconUrl: payload.iconUrl,
    section: payload.section,
    appType: payload.appType,
    position: payload.position,

    ...(payload.sectionTitle && { sectionTitle: payload.sectionTitle }),
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
    section: "QUICK_SERVICES" | "BOOKING" | "OTHER";
    sectionTitle: string;
    appType: AppType;
    position: number;
    actionType: "NAVIGATE" | "API";
    actionValue: string;
    isActive: boolean;
  }>,
): Promise<IDashboardItem | null> => {
  // ✅ Prevent invalid ObjectId crash
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid dashboard item ID");
  }

  return DashboardItem.findByIdAndUpdate(
    id,
    { $set: payload },
    { new: true, runValidators: true },
  );
};

// --------------------
// DELETE
// --------------------
export const deleteDashboardItemService = async (
  id: string,
): Promise<IDashboardItem | null> => {
  // ✅ Prevent crash
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("Invalid dashboard item ID");
  }

  return DashboardItem.findByIdAndDelete(id);
};
