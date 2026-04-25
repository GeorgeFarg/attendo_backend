import type { NextFunction, Request, Response } from "express";
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from "@/validators/auth.schema.ts";
import {
  registerUser,
  createUserSession,
  loginUser,
} from "@/services/auth.service.ts";
import { sendVerificationOtp, verifyOtp } from "@/services/otp.service.ts";
import { prisma } from "@/lib/prisma.ts";
import { verifyRefreshToken, generateAccessToken } from "@/lib/jwt.ts";

// POST /auth/register — create user and send OTP
const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const data = registerSchema.parse(req.body);
    const user = await registerUser(data);
    await sendVerificationOtp(user.email);
    res
      .status(201)
      .json({ message: "OTP sent to your email. Please verify to continue." });
  } catch (err) {
    next(err);
  }
};

// POST /auth/verify-otp — verify OTP and create session
const verifyOtpController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, otp } = verifyOtpSchema.parse(req.body);
    const valid = await verifyOtp(email, otp);

    if (!valid) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    const user = await prisma.user.update({
      where: { email },
      data: {
        isValid: true,
      },
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const session = await createUserSession(user.id);
    res.status(200).json({
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// POST /auth/login — verify Login and create session
const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { email, password, remember } = loginSchema.parse(req.body);
    const user = await loginUser(email, password);

    if (!user) {
      res.status(400).json({ message: "invalid input" });
      return;
    }

    if (!user.isValid) {
      await sendVerificationOtp(user.email);
      res.status(403).json({
        message: "Email not verified. A new OTP has been sent to your email.",
      });
    } else {
      const session = await createUserSession(user.id, remember);
      res.status(200).json({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      });
    }
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
  registerController,
  verifyOtpController,
  loginController,
  refreshTokenController,
};
