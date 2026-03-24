import User from "../../models/user/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";

export interface JwtPayload {
  id: string;
  //   role: "admin" | "user" | "technician";
  iat?: number;
  exp?: number;
}

const USER_JWT_ACCESS_SECRET =
  process.env.USER_JWT_ACCESS_SECRET || "access_secret";
const USER_JWT_REFRESH_SECRET =
  process.env.USER_JWT_REFRESH_SECRET || "refresh_secret";

export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) throw new Error("Refresh token required");

  let payload: JwtPayload | null = null;
  let user;

  try {
    // Decode and verify token throws error if invalid/expired
    payload = verifyRefreshToken(
      refreshToken,
      USER_JWT_REFRESH_SECRET,
    ) as JwtPayload;
  } catch {
    // Try to find user by token and clear invalid one from DB
    user = await User.findOne({ refreshToken });
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    // Rethrow error so controller clears cookie
    throw new Error("Invalid or expired refresh token");
  }

  // Check if user exists and token matches
  user = await User.findById(payload.id);
  if (!user) throw new Error("User not found");

  if (user.refreshToken !== refreshToken) {
    user.refreshToken = undefined;
    await user.save();
    throw new Error("Invalid refresh token");
  }

  // Rotate tokens (issue new ones)
  const newAccessToken = generateAccessToken(
    {
      id: user._id,
      //   role: user.role,
    },
    USER_JWT_ACCESS_SECRET,
  );

  const newRefreshToken = generateRefreshToken(
    {
      id: user._id,
      //   role: user.role,
    },
    USER_JWT_REFRESH_SECRET,
  );

  user.refreshToken = newRefreshToken;
  await user.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
