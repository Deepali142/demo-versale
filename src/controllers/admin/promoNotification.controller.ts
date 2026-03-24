import { Request, Response } from "express";
import {
  getAdminPromoNotificationListService,
  sendPromoNotificationService,
} from "../../services/admin/promoNotification.service";
import { HTTP_CODE, MESSAGE } from "../../constants/responseConstants";

export const sendPromoNotification = async (req: Request, res: Response) => {
  try {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(HTTP_CODE.BAD_REQUEST).json({
        success: false,
        message: MESSAGE.PROMO_REQUIRED_FIELDS,
      });
    }

    const result = await sendPromoNotificationService(title, body);

    return res.status(HTTP_CODE.SUCCESS).json({
      success: true,
      message: MESSAGE.PROMO_SENT_SUCCESS,
      data: {
        sentCount: result.sentCount,
        totalUsers: result.totalUsers,
        savedPromoNotification: {
          id: result.savedPromo._id,
          title: result.savedPromo.title,
          body: result.savedPromo.body,
          createdAt: result.savedPromo.createdAt,
        },
      },
    });
  } catch (error: unknown) {
    return res.status(HTTP_CODE.SERVER_ERROR).json({
      success: false,
      message: MESSAGE.SERVER_ERROR,
      error:
        error instanceof Error ? error.message : MESSAGE.INTERNAL_SERVER_ERROR,
    });
  }
};

export const adminPromoNotificationList = async (
  req: Request,
  res: Response,
) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;

    const search = (req.query.search as string)?.trim() || "";
    const sortField = (req.query.sortby as string) || "createdAt";
    const sortOrder: 1 | -1 = req.query.orderby === "asc" ? 1 : -1;

    const { notifications, total } = await getAdminPromoNotificationListService(
      page,
      limit,
      search,
      sortField,
      sortOrder,
    );

    return res.status(HTTP_CODE.SUCCESS).json({
      success: true,
      message: MESSAGE.FETCH_SUCCESS,
      data: notifications,
      count: total,
      page,
      limit,
    });
  } catch (error: unknown) {
    return res.status(HTTP_CODE.SERVER_ERROR).json({
      success: false,
      message: MESSAGE.FETCH_FAILED,
      error:
        error instanceof Error ? error.message : MESSAGE.INTERNAL_SERVER_ERROR,
    });
  }
};
