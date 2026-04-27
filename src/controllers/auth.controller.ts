import type { NextFunction, Request, Response } from "express";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/validators/auth.schema.ts";
import { createUserSession, loginUser } from "@/services/auth.service.ts";
import {
  sendPasswordResetOtp,
  verifyPasswordResetOtp,
} from "@/services/otp.service.ts";
import { prisma } from "@/lib/prisma.ts";
import { verifyRefreshToken, generateAccessToken } from "@/lib/jwt.ts";
import bcrypt from "bcrypt";

// POST /auth/forgot-password — send OTP to email for password reset
const forgotPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await sendPasswordResetOtp(user.id, user.email);
    res.status(200).json({
      message: "OTP sent to your email for password reset",
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/reset-password — verify OTP and reset password
const resetPasswordController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
    const valid = await verifyPasswordResetOtp(email, otp);

    if (!valid) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hashedPassword,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      message: "Password reset successfully",
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login — verify login credentials and create session
const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, remember } = loginSchema.parse(req.body);
    const user = await loginUser(email, password);

    if (!user) {
      res.status(400).json({ message: "Invalid email or password" });
      return;
    }

    const session = await createUserSession(user.id, remember);
    res.status(200).json({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/refresh — generate a new access token using refresh token
const refreshTokenController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ message: "Refresh token is required" });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);

    if (!payload) {
      res.status(401).json({ message: "Invalid or expired refresh token" });
      return;
    }

    const newAccessToken = generateAccessToken(payload.userId);
    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

export {
  forgotPasswordController,
  resetPasswordController,
  loginController,
  refreshTokenController,
};
