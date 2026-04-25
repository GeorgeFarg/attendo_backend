import { Router } from "express";
import {
  registerController,
  verifyOtpController,
  loginController,
  refreshTokenController,
} from "../controllers/auth.controller.ts";

const router = Router();

router.post("/register", registerController);
router.post("/verify-otp", verifyOtpController);
router.post("/login", loginController);
router.post("/refresh", refreshTokenController);

export default router;
