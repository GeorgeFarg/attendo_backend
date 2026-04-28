import { Router } from "express";
import { attendanceController } from "../controllers/attendance.controller.ts";
import { isStaff } from "@/middlewares/user.middleware.ts";

const router = Router();

/**
 * Attendance Routes
 * All routes require authentication via middleware
 */

// ========================
// PROFESSOR ROUTES
// ========================

/**
 * POST /attendance/session/start
 * Create a new live attendance session
 * - Only professors/staff can create sessions
 * - Returns: { sessionId, secret, startTime, status }
 */
router.post("/session/start", isStaff, (req, res, next) =>
  attendanceController.startSession(req, res, next),
);

/**
 * GET /attendance/session/:sessionId/qr
 * Get current rotating QR token
 * - Returns: { qr: "sessionId:timeWindow:signature", timeWindow, expiresIn }
 * - QR rotates every 5 seconds
 */
router.get("/session/:sessionId/qr", isStaff, (req, res, next) =>
  attendanceController.getQR(req, res, next),
);

/**
 * POST /attendance/session/:sessionId/close
 * Close an attendance session (only creator can close)
 * - Returns: { success, message }
 */
router.post("/session/:sessionId/close", isStaff, (req, res, next) =>
  attendanceController.closeSession(req, res, next),
);

/**
 * GET /attendance/session/:sessionId
 * Get session details with attendance count
 */
router.get("/session/:sessionId", isStaff, (req, res, next) =>
  attendanceController.getSession(req, res, next),
);

/**
 * GET /attendance/session/:sessionId/records
 * Get all attendance records for a session
 */
router.get("/session/:sessionId/records", isStaff, (req, res, next) =>
  attendanceController.getSessionAttendances(req, res, next),
);

// STUDENT ROUTES

/**
 * POST /attendance/mark
 * Student marks attendance by submitting QR token
 * Request body: { token: "sessionId:timeWindow:signature" }
 * - Returns: { id, studentId, attendanceSessionId, markedAt }
 * - Token must be valid and not expired (±1 time window)
 * - Student can only mark once per session
 */
router.post("/mark", (req, res, next) =>
  attendanceController.markAttendance(req, res, next),
);

export default router;
