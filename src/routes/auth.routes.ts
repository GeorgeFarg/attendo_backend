import { Router } from "express";
import {
  verifyOtpController,
  loginController,
  refreshTokenController,
} from "../controllers/auth.controller.ts";

const router = Router();

router.post("/verify-otp", verifyOtpController);
router.post("/login", loginController);
router.post("/refresh", refreshTokenController);

export default router;
