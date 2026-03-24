import jwt from "jsonwebtoken";

export interface JwtPayload {
  id: string; // MongoDB _id
  role: "admin" | "user" | "technician";
  iat?: number; // issued at (optional, auto-added by JWT)
  exp?: number; // expiry time (optional)
}

// Generate short-lived access token (15 min)
export const generateAccessToken = (payload: object, secret: string) => {
  return jwt.sign(payload, secret, { expiresIn: "15m" });
};

// Generate long-lived refresh token (30 days)
export const generateRefreshToken = (payload: object, secret: string) => {
  return jwt.sign(payload, secret, { expiresIn: "30d" });
};

// Verify tokens
export const verifyAccessToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};

export const verifyRefreshToken = (token: string, secret: string) => {
  return jwt.verify(token, secret);
};
