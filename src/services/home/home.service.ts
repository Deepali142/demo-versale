import { getHomeBannerListService } from "../homeBanner/homeBanner.service";
import {
  DashboardSectionResponse,
  getDashboardItemsService,
} from "../dashboard/dashboard.service";

import { HomeBannerPlain } from "../../types/homeBanner.types";

// --------------------
type AppType = "USER" | "TECHNICIAN";
type Screen = "COUPON" | "AD" | "HOME" | "PARTNER" | "HOW_IT_WORK" | "STERILIZATION";

// --------------------
interface HomeScreenResponse {
  banners: HomeBannerPlain[];
  dashboard: DashboardSectionResponse[];
}

// --------------------
export const getHomeScreenService = async (
  appType: AppType,
  screen?: Screen,
): Promise<HomeScreenResponse> => {
  console.log(`Fetching home screen data for appType: ${appType}, screen: ${screen}`);
  const [banners, dashboard] = await Promise.all([
    getHomeBannerListService({
      appType,
      ...(screen ? { destination: screen } : {}),
    }),
    getDashboardItemsService({
      appType,
      ...(screen ? { screen } : {}), 
    }),
  ]);

  return {
    banners: Array.isArray(banners) ? banners : [],
    dashboard: Array.isArray(dashboard) ? dashboard : [],
  };
};
