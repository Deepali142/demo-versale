import express from "express";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db";
import cookieParser from "cookie-parser";
import adminRoutes from "./routes/admin/admin.routes";
import technicianRoutes from "./routes/technician/technician.routes";
import userRoutes from "./routes/user/user.routes";
import homeRoutes from "./routes/home/home.routes";
import enquiryRoutes from "./routes/admin/enquiry.routes";
import shopRoutes from "./routes/admin/shop.routes"

const app = express();

app.use(express.json());
app.use(cookieParser());

connectDB();
app.use("/api/v1", adminRoutes, technicianRoutes, userRoutes, homeRoutes,enquiryRoutes,shopRoutes);

app.get("/keep-alive", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Server is alive 🚀",
    time: new Date(),
  });
});

export default app;
