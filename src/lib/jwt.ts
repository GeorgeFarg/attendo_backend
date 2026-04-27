import jwt from "jsonwebtoken";
import { config } from "@/config/env.ts";
import type { User } from "@/types/user.d.ts";

export interface TokenPayload {
  userId: number;
  type: "access" | "refresh";
}

/**
 * Generate an access token
 */
export function generateAccessToken(user: User): string {
  return jwt.sign({ user, type: "access" }, config.JWT_SECRET, {
    expiresIn: "15m",
  });
}

/**
 * Generate a refresh token
 */
export function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId, type: "refresh" }, config.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    if (decoded.type !== "access") return null;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token and return the payload
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(
      token,
      config.JWT_REFRESH_SECRET,
    ) as TokenPayload;
    if (decoded.type !== "refresh") return null;
    return decoded;
  } catch {
    return null;
  }
}
