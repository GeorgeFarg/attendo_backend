import type { Request, Response, NextFunction } from "express";
import { attendanceService } from "../services/attendance.service.ts";
import { attendanceMarkSchema } from "../validators/attendance.schema.ts";
import type { JWTPayload } from "../types/attendance.d.ts";
import type { AuthenticatedRequest } from "@/middlewares/auth.middleware.ts";
import { prisma } from "@/lib/prisma.ts";

/**
 * Attendance Controller
 * Handles HTTP requests for attendance endpoints
 */
class AttendanceController {
  /**
   * POST /attendance/session/start
   * Professor creates a new live attendance session
   */
  async startSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const fetchedStaff = await prisma.staffMember.findUnique({
        where: {
          userId: user.id
        }
      })

      // Verify user is a professor/staff
      if (!["PROFESSOR", "MANAGER", "ASSISTANT"].includes(fetchedStaff?.role ?? "")) {
        res
          .status(403)
          .json({ error: "Only staff members can create attendance sessions" });
        return;
      }

      const session = await attendanceService.createSession(user.id);

      res.status(201).json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /attendance/session/:sessionId/qr
   * Get current QR token for the session
   */
  async getQR(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // if (!req.user) {
      //   res.status(401).json({ error: "Unauthorized" });
      //   return;
      // }

      const sessionIdParam = req.params.sessionId;
      const sessionId = Array.isArray(sessionIdParam)
        ? sessionIdParam[0]
        : sessionIdParam;

      if (!sessionId) {
        res.status(400).json({ error: "sessionId is required" });
        return;
      }

      const qrData = await attendanceService.generateQR(sessionId);

      res.status(200).json({
        success: true,
        data: qrData,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Session not found") {
          res.status(404).json({ error: "Session not found" });
          return;
        }
        if (error.message === "Session is not active") {
          res.status(410).json({ error: "Session is no longer active" });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * POST /attendance/mark
   * Student marks attendance by submitting QR token
   */
  async markAttendance(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // Validate request body
      const validationResult = attendanceMarkSchema.parse(req.body);
      //   if (!validationResult.success) {
      //     res.status(400).json({
      //       error: "Validation failed",
      //       details: validationResult.error.errors,
      //     });
      //     return;
      //   }

      const { token } = validationResult;

      const attendance = await attendanceService.markAttendance(
        token,
        req.user.id,
      );

      res.status(200).json({
        success: true,
        data: attendance,
        message: "Attendance marked successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        const errorMap: Record<string, number> = {
          "Session not found": 404,
          "Student not found": 404,
          "Session is not active": 410,
          "Student already marked attendance for this session": 409,
          "Token expired": 401,
          "Invalid token signature": 401,
        };

        const statusCode = Object.entries(errorMap).find(
          ([msg]) => error.message.includes(msg) || error.message === msg,
        )?.[1];

        if (statusCode) {
          res.status(statusCode).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * POST /attendance/session/:sessionId/close
   * Professor closes an attendance session
   */
  async closeSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const sessionIdParam = req.params.sessionId;
      const sessionId = Array.isArray(sessionIdParam)
        ? sessionIdParam[0]
        : sessionIdParam;

      await attendanceService.closeSession(sessionId ?? "", req.user.id);

      res.status(200).json({
        success: true,
        message: "Session closed successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Session not found") {
          res.status(404).json({ error: "Session not found" });
          return;
        }
        if (error.message.includes("Unauthorized")) {
          res.status(403).json({ error: error.message });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * GET /attendance/session/:sessionId
   * Get session details with attendance count
   */
  async getSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      // const { sessionId } = req.params;
      const sessionIdParam = req.params.sessionId;
      const sessionId = Array.isArray(sessionIdParam)
        ? sessionIdParam[0]
        : sessionIdParam;
      const session = await attendanceService.getSession(sessionId ?? '');

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "Session not found") {
        res.status(404).json({ error: "Session not found" });
        return;
      }
      next(error);
    }
  }

  /**
   * GET /attendance/session/:sessionId/records
   * Get all attendance records for a session
   */
  async getSessionAttendances(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const sessionIdParam = req.params.sessionId;
      const sessionId = Array.isArray(sessionIdParam)
        ? sessionIdParam[0]
        : sessionIdParam;

      if (!sessionId)
        throw new Error("Session not found");

      const records = await attendanceService.getSessionAttendances(sessionId);

      res.status(200).json({
        success: true,
        data: records,
        count: records.length,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
