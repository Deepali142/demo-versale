import admin from "firebase-admin";
import type { ServiceAccount } from "firebase-admin";
import { googleServiceAccount } from "../config/googleService";

// const serviceAccount: ServiceAccount = require("../../notification.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(googleServiceAccount as ServiceAccount),
  });
}

/**
 * Send push notification using Firebase Cloud Messaging (FCM)
 * @param registrationToken - FCM token of the target device
 * @param title - Notification title
 * @param body - Notification body
 * @returns Promise<string> - Message ID from Firebase
 */
export async function sendPushNotification(
  registrationToken: string,
  title: string,
  body: string,
): Promise<string> {
  const message: admin.messaging.Message = {
    notification: {
      title: title || "Default Title",
      body: body || "Default Body",
    },
    token: registrationToken,
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } },
  };

  console.log("Sending Notification with Payload:", message);

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error sending message:", error.message);
      throw new Error(error.message);
    } else {
      console.error("Unknown error while sending notification:", error);
      throw new Error("Unknown error occurred while sending notification");
    }
  }
}
