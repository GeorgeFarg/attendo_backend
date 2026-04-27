import { Router } from "express";
import {
  forgotPasswordController,
  resetPasswordController,
  loginController,
  refreshTokenController,
} from "../controllers/auth.controller.ts";

const router = Router();

router.post("/login", loginController);
router.post("/forgot-password", forgotPasswordController);
router.post("/reset-password", resetPasswordController);
router.post("/refresh", refreshTokenController);

export default router;
