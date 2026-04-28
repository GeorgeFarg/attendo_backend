import { createUsersController } from "@/controllers/user.controller.ts";
import { isManager } from "@/middlewares/user.middleware.ts";
import { Router } from "express";

const router = Router();

router.post("/", isManager, createUsersController);

export default router;
