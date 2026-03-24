import { getHomeBannerListService } from "../homeBanner/homeBanner.service";
import {
  DashboardSectionResponse,
  getDashboardItemsService,
} from "../dashboard/dashboard.service";
import { IHomeBanner } from "../../models/homeBanner/homeBanner.model";

// --------------------
type AppType = "USER" | "TECHNICIAN";

// --------------------
interface HomeScreenResponse {
  banners: IHomeBanner[]; // ✅ FIXED (NO any)
  dashboard: DashboardSectionResponse[];
}

// --------------------
export const getHomeScreenService = async (
  type: AppType,
): Promise<HomeScreenResponse> => {
  const [banners, dashboard] = await Promise.all([
    getHomeBannerListService({ appType: type }),
    getDashboardItemsService({ appType: type }),
  ]);

  return {
    banners,
    dashboard,
  };
};
