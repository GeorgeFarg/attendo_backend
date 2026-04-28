import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "./auth.middleware.ts";
import { prisma } from "@/lib/prisma.ts";

export async function isManager(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;

  if (!userId) {
    res
      .status(401)
      .json({ message: "Missing or invalid authorization header" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      staff: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (user.staff?.role !== "MANAGER") {
    res.status(401).json({ message: "Invalid or expired access token" });
    return;
  }

  next();
}

export async function isStaff(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const userId = req.user?.id;

  if (!userId) {
    res
      .status(401)
      .json({ message: "Missing or invalid authorization header" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      staff: true,
    },
  });

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  if (!user.staff) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }

  next();
}
