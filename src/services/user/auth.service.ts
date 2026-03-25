import User from "../../models/user/user.model";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";

export interface JwtPayload {
  id: string;
  type?: "ACCESS" | "REFRESH";
  iat?: number;
  exp?: number;
}

const USER_JWT_ACCESS_SECRET =
  process.env.USER_JWT_ACCESS_SECRET || "access_secret";

const USER_JWT_REFRESH_SECRET =
  process.env.USER_JWT_REFRESH_SECRET || "refresh_secret";

export const refreshAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new Error("Refresh token required");
  }

  let payload: JwtPayload;

  try {
    payload = verifyRefreshToken(
      refreshToken,
      USER_JWT_REFRESH_SECRET,
    ) as JwtPayload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  if (payload.type !== "REFRESH") {
    throw new Error("Invalid token type");
  }

  const user = await User.findById(payload.id);
  if (!user) {
    throw new Error("User not found");
  }

  const newAccessToken = generateAccessToken(
    { id: user._id.toString(), type: "ACCESS" },
    USER_JWT_ACCESS_SECRET,
  );

  const newRefreshToken = generateRefreshToken(
    { id: user._id.toString(), type: "REFRESH" },
    USER_JWT_REFRESH_SECRET,
  );

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};
