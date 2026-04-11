import { getHomeBannerListService } from "../homeBanner/homeBanner.service";
import {
  DashboardSectionResponse,
  getDashboardItemsService,
} from "../dashboard/dashboard.service";

import { AppType, Screen } from "../../types/config.types";
import { HomeBannerPlain } from "../../types/homeBanner.types";
import { HomeScreenConfig } from "../../models/homeBanner/screenConfig.model";
import { SECTION, SectionType } from "../../types/section.types";
import { getFeaturedProductsService } from "../shop/product.service";

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

type DashboardItemResponse = ReturnType<typeof formatDashboardItems>[number];

type ServiceTypeItemResponse = DashboardItemResponse & {
  children: ServiceTypeItemResponse[];
};

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
      items: DashboardItemResponse[];
    }
  | {
      type: "UTILITIES";
      section: "UTILITIES";
      title: string;
      items: DashboardItemResponse[];
    }
  | {
      type: "SERVICE_TYPE";
      section: "SERVICE_TYPES";
      title: string;
      items: ServiceTypeItemResponse[];
    }
  | {
      type: "PRODUCT_LIST";
      section: string;
      items: unknown[];
      title: string;
      isVisible?: boolean;
    }
  | {
      type: "INFO";
      section: string;
      items: { title: string; description: string }[];
    };


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

export const getHomeScreenService = async (
  appType: AppType,
  screen?: Screen,
): Promise<HomeSectionResponse[]> => {

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

  const bannerMap: Record<"TOP" | "MIDDLE" | "BOTTOM", HomeBannerPlain[]> = {
    TOP: bannerList.filter((b) => b.section === "TOP"),
    MIDDLE: bannerList.filter((b) => b.section === "MIDDLE"),
    BOTTOM: bannerList.filter((b) => b.section === "BOTTOM"),
  };

  const dashboardMap = new Map(dashboardList.map((d) => [d.section, d]));

  const sortedSections = config.sections
    .filter((s: any) => s.isActive)
    .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

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
      items,
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
        parentId: item.parentId?.toString() || null, // ✅ important
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

  const buildServiceTypeTree = (items: any[]) => {
    if (!items?.length) return [];

    if (items[0]?.children) {
      const sortTree = (nodes: any[]) => {
        nodes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        nodes.forEach((n) => {
          if (n.children?.length) sortTree(n.children);
        });
      };

      sortTree(items);
      return items;
    }

    const map = new Map<string, any>();

    const formatted = formatDashboardItems(items).map((item) => ({
      ...item,
      children: [],
    }));

    formatted.forEach((item) => {
      map.set(item._id.toString(), item);
    });

    const root: any[] = [];

    formatted.forEach((item) => {
      if (item.parentId && map.has(item.parentId.toString())) {
        map.get(item.parentId.toString()).children.push(item);
      } else {
        root.push(item);
      }
    });

    const sortTree = (nodes: any[]) => {
      nodes.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      nodes.forEach((n) => {
        if (n.children?.length) sortTree(n.children);
      });
    };

    sortTree(root);

    return root;
  };
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
        const sectionKey =
          screen === "STERILIZATION" ? "SERVICE_TYPES" : "BOOKING";

        const services = dashboardMap.get(sectionKey);

        if (services?.items?.length) {
          if (screen === "STERILIZATION") {
            response.push({
              type: "SERVICE_TYPE",
              section: "SERVICE_TYPES",
              title: services.title || "Select Service Type",
              items: buildServiceTypeTree(services.items),
            });
          } else {
            response.push({
              type: "DASHBOARD",
              section: "BOOKING",
              title: services.title || "Services",
              items: formatDashboardItems(services.items),
            });
          }
        }
        break;
      }

      case "REQUEST": {
        const request = dashboardMap.get("REQUEST");

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

      case "PRODUCT_LIST":
        if (screen === "HOME") {
          const featuredData = await getFeaturedProductsService({
            page: "1",
            limit: "5",
          });

          if (featuredData?.products?.length) {
            response.push({
              type: "PRODUCT_LIST",
              section: "PRODUCTS",
              items: featuredData.products,
              title:"Feature Product",
              isVisible: true,
            });
          }
        }
        break;

      case "MIDDLE_BANNER":
        handleBanner("MIDDLE", bannerDisplay);
        break;

       case "UTILITIES": {
        const utilities = dashboardMap.get("UTILITIES");

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

      case "STERILIZATION_INFO": {
        const info = dashboardMap.get("STERILIZATION_INFO");

        if (info?.items?.length) {
          response.push({
            type: "INFO",
            section: "STERILIZATION",
            items: info.items.map((i: any) => ({
              title: i.title,
              description: i.description,
            })),
          });
        }
        break;
      }

      case "BOTTOM_BANNER":
        handleBanner("BOTTOM", bannerDisplay);
        break;

      default:
        console.warn(`Unhandled section key: ${sec.key}`);
    }
  }

  return response;
};

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
