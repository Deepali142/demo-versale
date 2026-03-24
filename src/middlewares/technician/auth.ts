import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// Define your JWT payload type
interface AuthPayload extends JwtPayload {
  id: string;
  role: string;
}

// Augment Express Request directly (no namespace)
declare module "express-serve-static-core" {
  interface Request {
    user?: AuthPayload;
  }
}

const TECHNICIAN_JWT_ACCESS_SECRET =
  process.env.TECHNICIAN_JWT_ACCESS_SECRET || "access_secret";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token missing" });
  }

  jwt.verify(token, TECHNICIAN_JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }

    req.user = decoded as AuthPayload;
    next();
  });
};
