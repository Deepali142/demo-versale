import * as otpService from "../../services/technician/otp.service";
import Technician from "../../models/technician/technician.model";
import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { technicianId } = req.body;
    const technician = await Technician.findById(technicianId);
    if (!technician)
      return res
        .status(404)
        .json({ success: false, message: "technician not found" });

    await otpService.createOtp(
      String(technician._id),
      technician.phoneNumber ?? "",
    );
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

const TECHNICIAN_JWT_ACCESS_SECRET =
  process.env.TECHNICIAN_JWT_ACCESS_SECRET || "access_secret";
const TECHNICIAN_JWT_REFRESH_SECRET =
  process.env.TECHNICIAN_JWT_REFRESH_SECRET || "refresh_secret";

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { technicianId, otp } = req.body;
    await otpService.verifyOtp(technicianId, otp);

    const technician = await Technician.findById(technicianId);
    if (!technician)
      return res
        .status(404)
        .json({ success: false, message: "Technician not found" });

    //  Generate tokens
    const accessToken = generateAccessToken(
      {
        id: technician._id,
        position: technician.position,
      },
      TECHNICIAN_JWT_ACCESS_SECRET,
    );
    const refreshToken = generateRefreshToken(
      {
        id: technician._id,
        position: technician.position,
      },
      TECHNICIAN_JWT_REFRESH_SECRET,
    );

    //  Save refreshToken in DB
    technician.refreshToken = refreshToken;
    technician.status = "AVAILABLE";
    await technician.save();

    // Send cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // ❗ set to true in production (HTTPS only)
      sameSite: "strict",
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    res.json({
      success: true,
      message: "OTP verified, technician activated",
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
