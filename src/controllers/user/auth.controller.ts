import { Request, Response } from "express";
import * as authService from "../../services/user/auth.service";

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ success: true, message: "Refresh token missing" });
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await authService.refreshAccessToken(refreshToken);

    // ✅ Set new refresh token cookie (rotation)
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: false, // true in production with HTTPS
      maxAge: 30 * 60 * 1000, // 30 minutes
    });

    return res.json({ success: true, accessToken });
  } catch (err) {
    // ❌ Handle invalid or expired refresh token
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: false,
    });

    if (err instanceof Error) {
      return res
        .status(403)
        .json({
          success: false,
          message: err.message || "Invalid or expired refresh token",
        });
    }

    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};
