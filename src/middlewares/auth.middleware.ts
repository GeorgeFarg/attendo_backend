import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "@/lib/jwt.ts";
import type { User } from "@/types/user.d.ts";

// declare global {
//   namespace Express {
//     interface Request {
//       userId?: number;
//     }
//   }
// }

export interface AuthenticatedRequest extends Request {
  user?: User;
}

/**
 * Middleware to verify JWT access token from Authorization header
 * Expected format: "Bearer <token>"
 */
export function Authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res
      .status(401)
      .json({ message: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7); // Remove "Bearer " prefix
  const payload = verifyAccessToken(token);

  if (!payload) {
    res.status(401).json({ message: "Invalid or expired access token" });
    return;
  }

  req.user = payload.user;
  next();
}
