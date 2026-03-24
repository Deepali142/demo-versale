import * as otpService from "../../services/user/otp.service";
import User from "../../models/user/user.model";
import { Request, Response } from "express";
import { generateAccessToken, generateRefreshToken } from "../../utils/jwt";

export const resendOtp = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "user not found" });

    await otpService.createOtp(String(user._id), user.phoneNumber ?? "");
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

const USER_JWT_ACCESS_SECRET =
  process.env.USER_JWT_ACCESS_SECRET || "access_secret";
const USER_JWT_REFRESH_SECRET =
  process.env.USER_JWT_REFRESH_SECRET || "refresh_secret";

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;
    await otpService.verifyOtp(userId, otp);

    const user = await User.findById(userId);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    //  Generate tokens
    const accessToken = generateAccessToken(
      {
        id: user._id,
        // role: user.role,
      },
      USER_JWT_ACCESS_SECRET,
    );
    const refreshToken = generateRefreshToken(
      {
        id: user._id,
        // role: user.role,
      },
      USER_JWT_REFRESH_SECRET,
    );

    //  Save refreshToken in DB
    user.refreshToken = refreshToken;
    // user.status = "active";
    await user.save();

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
