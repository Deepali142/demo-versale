import User from "../../models/user/user.model";
import { Notification } from "../../models/notification/notification.model";
import {
  IPromotionalNotification,
  PromotionalNotification,
} from "../../models/admin/promoNotification.model";
import { sendPushNotification } from "../../utils/notification";

export const sendPromoNotificationService = async (
  title: string,
  body: string,
) => {
  // Fetch inactive users
  const users = await User.find({ isActive: false }).select("deviceToken");

  let sentCount = 0;

  for (const user of users) {
    if (user.deviceToken && user.deviceToken.trim() !== "") {
      await sendPushNotification(user.deviceToken, title, body);

      await Notification.create({
        userId: user._id,
        text: body,
      });

      sentCount++;
    }
  }

  // Store promo notification record
  const promo = await PromotionalNotification.create({
    title,
    body,
  });

  return {
    sentCount,
    totalUsers: users.length,
    savedPromo: promo,
  };
};

export const getAdminPromoNotificationListService = async (
  page: number,
  limit: number,
  search: string,
  sortField: string,
  sortOrder: 1 | -1,
): Promise<{ notifications: IPromotionalNotification[]; total: number }> => {
  const query = search
    ? {
        $or: [
          { title: { $regex: search, $options: "i" } },
          { body: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const total = await PromotionalNotification.countDocuments(query);

  const notifications = await PromotionalNotification.find(query)
    .sort({ [sortField]: sortOrder })
    .skip((page - 1) * limit)
    .limit(limit);

  return { notifications, total };
};
