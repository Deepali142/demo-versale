import * as otpService from "../../services/admin/otp.service";
import Admin from "../../models/admin/admin.model";
import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.body;
    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "admin not found" });

    await otpService.createOtp(String(admin._id), admin.phoneNumber ?? "");
    res.json({ success: true, message: "OTP resent successfully" });
  } catch (err: unknown) {
    res
      .status(400)
      .json({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
  }
};

const ADMIN_JWT_ACCESS_SECRET =
  process.env.ADMIN_JWT_ACCESS_SECRET || "access_secret";
const ADMIN_JWT_REFRESH_SECRET =
  process.env.ADMIN_JWT_REFRESH_SECRET || "refresh_secret";

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { adminId, otp } = req.body;
    await otpService.verifyOtp(adminId, otp);

    const admin = await Admin.findById(adminId);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    //  Generate tokens
    const accessToken = generateAccessToken(
      {
        id: admin._id,
        role: admin.role,
      },
      ADMIN_JWT_ACCESS_SECRET,
    );
    const refreshToken = generateRefreshToken(
      {
        id: admin._id,
        role: admin.role,
      },
      ADMIN_JWT_REFRESH_SECRET,
    );

    //  Save refreshToken in DB
    admin.refreshToken = refreshToken;
    admin.status = "active";
    await admin.save();

    // Send cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // ❗ set to true in production (HTTPS only)
      sameSite: "strict",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.json({
      success: true,
      message: "OTP verified, admin activated",
      accessToken,
      refreshToken,
    });
  } catch (err: unknown) {
    res
      .status(400)
      .json({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
  }
};
