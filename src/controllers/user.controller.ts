import type { AuthenticatedRequest } from "@/middlewares/auth.middleware.ts";
import { createUser } from "@/services/user.service.ts";
import { createUserSchema } from "@/validators/user.schema.ts";
import type { NextFunction, Response } from "express";

const createUsersController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      message: "Unauthorized",
    });
    return;
  }

  try {
    const dataInput = createUserSchema.parse(req.body);
    const createdUser = createUser(dataInput);
    res.status(201).json({
      message: "User created Successfully",
      user: createdUser,
    });
  } catch (error) {
    next(error);
  }
};

export { createUsersController };
