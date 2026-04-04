import { getHomeBannerListService } from "../homeBanner/homeBanner.service";
import {
  DashboardSectionResponse,
  getDashboardItemsService,
} from "../dashboard/dashboard.service";

import { AppType, Screen } from "../../types/config.types";
import { HomeBannerPlain } from "../../types/homeBanner.types";
import { HomeScreenConfig } from "../../models/homeBanner/screenConfig.model";
import { SECTION, SectionType } from "../../types/section.types";


// --------------------
// TYPES
// --------------------

type BannerDisplay = "CAROUSEL" | "STATIC" | "AUTO";
type BannerSectionKey = "TOP" | "MIDDLE" | "BOTTOM";

// All possible section keys
export type SectionKey =
  | "TOP_BANNER"
  | "SERVICE_TYPES"
  | "REQUEST"
  | "UTILITIES"
  | "MIDDLE_BANNER"
  | "PRODUCT_LIST"
  | "STERILIZATION_INFO"
  | "BOTTOM_BANNER";

export type HomeSectionResponse =
  | {
      type: "BANNER";
      section: BannerSectionKey;
      bannerDisplay: BannerDisplay;
      items: HomeBannerPlain[];
    }
  | {
      type: "DASHBOARD";
      section: string;
      title: string;
      items: ReturnType<typeof formatDashboardItems>;
    }
  |  {
      type: "UTILITIES"; 
      section: "UTILITIES";
      title: string;
      items: ReturnType<typeof formatDashboardItems>;
     }
  |  {
      type: "PRODUCT_LIST";
      section: string;
      items: unknown[];
      isVisible?: boolean;
    }
  | {
      type: "INFO";
      section: string;
      items: { title: string; description: string }[];
    };

// --------------------
// HELPERS (MOVE ABOVE FOR TS)
// --------------------

const formatDashboardItems = (items: any[]) => {
  return items
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((item) => ({
      _id: item._id,
      name: item.name,
      iconUrl: item.iconUrl,
      position: item.position,
      action: {
        type: item.actionType,
        id: item.service?._id ?? item.actionValue ?? null,
      },
      service: item.service
        ? {
            _id: item.service._id,
            name: item.service.name,
            unitPrice: item.service.unitPrice,
          }
        : null,
    }));
};

// --------------------
// SERVICE
// --------------------

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

  if (!config?.sections?.length) {
    console.warn("No config found → returning empty");
    return [];
  }

  const bannerList: HomeBannerPlain[] = Array.isArray(banners) ? banners : [];
  const dashboardList: DashboardSectionResponse[] = Array.isArray(dashboard)
    ? dashboard
    : [];

  // ✅ Banner grouping
  const bannerMap: Record<"TOP" | "MIDDLE" | "BOTTOM", HomeBannerPlain[]> = {
    TOP: bannerList.filter((b) => b.section === "TOP"),
    MIDDLE: bannerList.filter((b) => b.section === "MIDDLE"),
    BOTTOM: bannerList.filter((b) => b.section === "BOTTOM"),
  };

  // ✅ Dashboard map (fix from your old logic)
  const dashboardMap = new Map(
    dashboardList.map((d) => [d.section, d]),
  );

  const sortedSections = config.sections
    .filter((s: any) => s.isActive)
    .sort((a: any, b: any) => a.order - b.order);

  const response: HomeSectionResponse[] = [];

  // --------------------
  // HELPERS
  // --------------------

  const handleBanner = (
    sectionKey: "TOP" | "MIDDLE" | "BOTTOM",
    bannerDisplay?: BannerDisplay,
  ) => {
    const items = [...bannerMap[sectionKey]].sort(
      (a, b) =>
        (a.order ?? 0) - (b.order ?? 0) ||
        (a.position ?? 0) - (b.position ?? 0),
    );

    if (!items.length) return;

    response.push({
      type: "BANNER",
      section: sectionKey,
      bannerDisplay: bannerDisplay ?? "AUTO",
      items, // ✅ FIXED (was data)
    });
  };

  const formatDashboardItems = (items: any[]) =>
    items
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((item) => ({
        _id: item._id,
        name: item.name,
        iconUrl: item.iconUrl,
        position: item.position,
        action: {
          type: item.actionType,
          id: item.service?._id ?? item.actionValue ?? null,
        },
        service: item.service
          ? {
              _id: item.service._id,
              name: item.service.name,
              unitPrice: item.service.unitPrice,
            }
          : null,
      }));

  // --------------------
  // MAIN LOOP
  // --------------------

  for (const sec of sortedSections) {
    const bannerDisplay = sec.bannerDisplay as BannerDisplay | undefined;

    switch (sec.key) {
      case "TOP_BANNER":
        handleBanner("TOP", bannerDisplay);
        break;

      case "SERVICE_TYPES": {

        const booking = dashboardMap.get("BOOKING"); // or SECTION.BOOKING if defined

        console.log("🚀 Booking Section:", booking);

        if (booking?.items?.length) {
          response.push({
            type: "DASHBOARD",
            section: "SERVICE_TYPES",
            title: booking.title || "Services",
            items: formatDashboardItems(booking.items), 
          });
        }
        break;
      }

      case "REQUEST": {
        const request = dashboardMap.get(SECTION.REQUEST);

        if (request?.items?.length) {
          response.push({
            type: "DASHBOARD",
            section: "REQUEST",
            title: request.title || "Request",
            items: formatDashboardItems(request.items),
          });
        }
        break;
      }

      case "UTILITIES": {
        const utilities = dashboardMap.get(SECTION.UTILITIES);

        if (utilities?.items?.length) {
          response.push({
            type: "UTILITIES",
            section: "UTILITIES",
            title: utilities.title || "Utilities",
            items: formatDashboardItems(utilities.items),
          });
        }
        break;
      }

      case "MIDDLE_BANNER":
        handleBanner("MIDDLE", bannerDisplay);
        break;

      case "PRODUCT_LIST":
        response.push({
          type: "PRODUCT_LIST",
          section: "PRODUCTS",
          items: [], // ✅ FIXED (was data)
          isVisible: false,
        });
        break;

      case "STERILIZATION_INFO":
        response.push({
          type: "INFO",
          section: "STERILIZATION",
          items: [
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
        handleBanner("BOTTOM", bannerDisplay);
        break;

      default:
        console.warn(`Unhandled section key: ${sec.key}`);
    }
  }

  return response;
};

// --------------------
// CONFIG SERVICES
// --------------------

export const createHomeConfigService = async (payload: {
  appType: AppType;
  screen: Screen;
  sections: {
    key: SectionKey;
    order: number;
    isActive?: boolean;
    bannerDisplay?: BannerDisplay;
  }[];
}) => {
  const exists = await HomeScreenConfig.findOne({
    appType: payload.appType,
    screen: payload.screen,
  });

  if (exists) {
    throw new Error("Config already exists");
  }

  return HomeScreenConfig.create(payload);
};

export const getHomeConfigListService = async (filters: {
  appType?: AppType;
  screen?: Screen;
}) => {
  return HomeScreenConfig.find({
    ...(filters.appType && { appType: filters.appType }),
    ...(filters.screen && { screen: filters.screen }),
  })
    .sort({ createdAt: -1 })
    .lean();
};

export const getHomeConfigByIdService = async (id: string) => {
  const config = await HomeScreenConfig.findById(id).lean();
  if (!config) throw new Error("Config not found");
  return config;
};

export const updateHomeConfigService = async (
  id: string,
  payload: Partial<{
    sections: {
      key: SectionKey;
      order: number;
      isActive?: boolean;
      bannerDisplay?: BannerDisplay;
    }[];
    isActive: boolean;
  }>,
) => {
  const updated = await HomeScreenConfig.findByIdAndUpdate(id, payload, {
    new: true,
  }).lean();

  if (!updated) throw new Error("Config not found");
  return updated;
};

export const deleteHomeConfigService = async (id: string) => {
  const deleted = await HomeScreenConfig.findByIdAndDelete(id);
  if (!deleted) throw new Error("Config not found");
  return { message: "Config deleted successfully" };
};