// src/cron.ts
import cron from "node-cron";
import axios from "axios";

const SERVER_URL = "https://demo-versale.onrender.com/keep-alive";

export const startCron = () => {
  // Every 40 seconds
  cron.schedule("*/40 * * * * *", async () => {
    try {
      const res = await axios.get(SERVER_URL);
      console.log("✅ Ping Success:", res.data);
    } catch (error: any) {
      console.error("❌ Ping Failed:", error.message);
    }
  });
};