import Technician from "../../models/technician/technician.model";
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

const TECHNICIAN_JWT_ACCESS_SECRET =
  process.env.TECHNICIAN_JWT_ACCESS_SECRET || "access_secret";
const TECHNICIAN_JWT_REFRESH_SECRET =
  process.env.TECHNICIAN_JWT_REFRESH_SECRET || "refresh_secret";

export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) throw new Error("Refresh token required");

  let payload: JwtPayload | null = null;
  let technician;

  try {
    // Decode and verify token throws error if invalid/expired
    payload = verifyRefreshToken(
      refreshToken,
      TECHNICIAN_JWT_REFRESH_SECRET,
    ) as JwtPayload;
  } catch {
    // Try to find user by token and clear invalid one from DB
    technician = await Technician.findOne({ refreshToken });
    if (technician) {
      technician.refreshToken = undefined;
      await technician.save();
    }

    // Rethrow error so controller clears cookie
    throw new Error("Invalid or expired refresh token");
  }

  // Check if user exists and token matches
  technician = await Technician.findById(payload.id);
  if (!technician) throw new Error("User not found");

  if (technician.refreshToken !== refreshToken) {
    technician.refreshToken = undefined;
    await technician.save();
    throw new Error("Invalid refresh token");
  }

  // Rotate tokens (issue new ones)
  const newAccessToken = generateAccessToken(
    {
      id: technician._id,
      position: technician.position,
    },
    TECHNICIAN_JWT_ACCESS_SECRET,
  );

  const newRefreshToken = generateRefreshToken(
    {
      id: technician._id,
      position: technician.position,
    },
    TECHNICIAN_JWT_REFRESH_SECRET,
  );

  technician.refreshToken = newRefreshToken;
  await technician.save();

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};
