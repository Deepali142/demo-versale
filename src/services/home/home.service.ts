import { getHomeBannerListService } from "../homeBanner/homeBanner.service";
import {
  DashboardSectionResponse,
  getDashboardItemsService,
} from "../dashboard/dashboard.service";
// services/homeConfig/homeConfig.service.ts

import { AppType, Screen } from "../../types/config.types";
import { HomeBannerPlain } from "../../types/homeBanner.types";
import { HomeScreenConfig } from "../../models/homeBanner/screenConfig.model";

// --------------------
interface HomeScreenResponse {
  banners: HomeBannerPlain[];
  dashboard: DashboardSectionResponse[];
}

type HomeSectionResponse =
  | { type: "BANNER"; section: "TOP" | "MIDDLE" | "BOTTOM"; data: any[] }
  | { type: "DASHBOARD"; section: string; data: any[] }
  | { type: "PRODUCT_LIST"; section: string; data: any[] }
  | { type: "INFO"; section: string; data: any[] };

export const getHomeScreenService = async (
  appType: AppType,
  screen?: Screen,
): Promise<HomeSectionResponse[]> => {
  console.log(
    `Fetching home screen data for appType: ${appType}, screen: ${screen}`,
  );

  const [banners, dashboard, config] = await Promise.all([
    getHomeBannerListService({
      appType,
      ...(screen ? { destination: screen } : {}),
    }),
    getDashboardItemsService({
      appType,
      ...(screen ? { screen } : {}),
    }),
    HomeScreenConfig.findOne({
      appType,
      screen,
      isActive: true,
    }).lean(),
  ]);

  const bannerList = Array.isArray(banners) ? banners : [];
  const dashboardList = Array.isArray(dashboard) ? dashboard : [];

  if (!config?.sections?.length) {
    console.warn("No config found → returning empty");
    return [];
  }

  const bannerMap = {
    TOP: bannerList.filter((b) => b.section === "TOP"),
    MIDDLE: bannerList.filter((b) => b.section === "MIDDLE"),
    BOTTOM: bannerList.filter((b) => b.section === "BOTTOM"),
  };

  const sortedSections = config.sections
    .filter((s) => s.isActive)
    .sort((a, b) => a.order - b.order);

  const response: HomeSectionResponse[] = [];

  const handleBanner = (
    sectionKey: "TOP" | "MIDDLE" | "BOTTOM",
    bannerMap: any,
    response: HomeSectionResponse[],
  ) => {
    const data = bannerMap[sectionKey].sort(
      (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0),
    );

    if (data.length) {
      response.push({
        type: "BANNER",
        section: sectionKey,
        data,
      });
    }
  };

  for (const sec of sortedSections) {
    switch (sec.key) {
      case "TOP_BANNER":
        handleBanner("TOP", bannerMap, response);
        break;

      case "SERVICE_TYPES": {
        const dashboardSection = dashboardList[0];

        if (dashboardSection?.items?.length) {
          const items = [...dashboardSection.items].sort(
            (a, b) => (a.position ?? 0) - (b.position ?? 0),
          );

          response.push({
            type: "DASHBOARD",
            section: dashboardSection.title || "Services",
            data: items,
          });
        }
        break;
      }

      case "MIDDLE_BANNER":
        handleBanner("MIDDLE", bannerMap, response);
        break;

      case "PRODUCT_LIST":
        response.push({
          type: "PRODUCT_LIST",
          section: "PRODUCTS",
          data: [],
        });
        break;

      case "STERILIZATION_INFO":
        response.push({
          type: "INFO",
          section: "STERILIZATION",
          data: [
            {
              title: "Deep Cleaning",
              description: "Kills bacteria, fungus & odor",
            },
            {
              title: "Chemical Treatment",
              description: "Removes 99.9% germs",
            },
          ],
        });
        break;

      case "BOTTOM_BANNER":
        handleBanner("BOTTOM", bannerMap, response);
        break;

      default:
        console.warn(`Unhandled section key: ${sec.key}`);
        break;
    }
  }
  return response;
};

// --------------------
// CREATE
// --------------------
export const createHomeConfigService = async (payload: {
  appType: AppType;
  screen: Screen;
  sections: {
    key: string;
    order: number;
    isActive?: boolean;
  }[];
}) => {
  const exists = await HomeScreenConfig.findOne({
    appType: payload.appType,
    screen: payload.screen,
  });

  if (exists) {
    throw new Error("Config already exists for this appType + screen");
  }

  return await HomeScreenConfig.create(payload);
};

// --------------------
// GET LIST
// --------------------
export const getHomeConfigListService = async (filters: {
  appType?: AppType;
  screen?: Screen;
}) => {
  return await HomeScreenConfig.find({
    ...(filters.appType && { appType: filters.appType }),
    ...(filters.screen && { screen: filters.screen }),
  })
    .sort({ createdAt: -1 })
    .lean();
};

// --------------------
// GET SINGLE
// --------------------
export const getHomeConfigByIdService = async (id: string) => {
  const config = await HomeScreenConfig.findById(id).lean();

  if (!config) {
    throw new Error("Config not found");
  }

  return config;
};

// --------------------
// UPDATE
// --------------------
export const updateHomeConfigService = async (
  id: string,
  payload: Partial<{
    sections: {
      key: string;
      order: number;
      isActive?: boolean;
    }[];
    isActive: boolean;
  }>,
) => {
  const updated = await HomeScreenConfig.findByIdAndUpdate(id, payload, {
    new: true,
  }).lean();

  if (!updated) {
    throw new Error("Config not found for update");
  }

  return updated;
};

// --------------------
// DELETE
// --------------------
export const deleteHomeConfigService = async (id: string) => {
  const deleted = await HomeScreenConfig.findByIdAndDelete(id);

  if (!deleted) {
    throw new Error("Config not found for deletion");
  }

  return { message: "Config deleted successfully" };
};
