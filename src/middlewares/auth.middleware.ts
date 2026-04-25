import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "@/lib/jwt.ts";

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

/**
 * Middleware to verify JWT access token from Authorization header
 * Expected format: "Bearer <token>"
 */
export function authMiddleware(
  req: Request,
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

  req.userId = payload.userId;
  next();
}
