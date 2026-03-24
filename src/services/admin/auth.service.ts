import Admin from "../../models/admin/admin.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";

export interface JwtPayload {
  id: string;
  role: "admin" | "user" | "technician";
  iat?: number;
  exp?: number;
}

const ADMIN_JWT_ACCESS_SECRET =
  process.env.ADMIN_JWT_ACCESS_SECRET || "access_secret";
const ADMIN_JWT_REFRESH_SECRET =
  process.env.ADMIN_JWT_REFRESH_SECRET || "refresh_secret";

export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) throw new Error("Refresh token required");

  let payload: JwtPayload | null = null;
  let admin;

  try {
    // Decode and verify token throws error if invalid/expired
    payload = verifyRefreshToken(
      refreshToken,
      ADMIN_JWT_REFRESH_SECRET,
    ) as JwtPayload;
  } catch {
    // Try to find user by token and clear invalid one from DB
    admin = await Admin.findOne({ refreshToken });
    if (admin) {
      admin.refreshToken = undefined;
      await admin.save();
    }

    // Rethrow error so controller clears cookie
    throw new Error("Invalid or expired refresh token");
  }

  // Check if user exists and token matches
  admin = await Admin.findById(payload.id);
  if (!admin) throw new Error("User not found");

  if (admin.refreshToken !== refreshToken) {
    admin.refreshToken = undefined;
    await admin.save();
    throw new Error("Invalid refresh token");
  }

  // Rotate tokens (issue new ones)
  const newAccessToken = generateAccessToken(
    {
      id: admin._id,
      role: admin.role,
    },
    ADMIN_JWT_ACCESS_SECRET,
  );

  const newRefreshToken = generateRefreshToken(
    {
      id: admin._id,
      role: admin.role,
    },
    ADMIN_JWT_REFRESH_SECRET,
  );

  admin.refreshToken = newRefreshToken;
  await admin.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
