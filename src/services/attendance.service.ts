import crypto from "crypto";
import { prisma } from "../lib/prisma.ts";
import type {
  AttendanceSessionPayload,
  QRResponse,
} from "../types/attendance.d.ts";

/**
 * Attendance Service
 * Handles all business logic for attendance sessions and marking
 */
class AttendanceService {
  /**
   * Create a new live attendance session
   * @param staffId - ID of the professor/staff creating the session
   * @returns Session info with secret
   */
  async createSession(staffId: number): Promise<AttendanceSessionPayload> {
    // Generate a random secret for QR signing
    const secret = crypto.randomBytes(32).toString("hex");

    const session = await prisma.attendanceSession.create({
      data: {
        staffId,
        secret,
        status: "ACTIVE",
      },
    });

    return {
      sessionId: session.id,
      secret: session.secret,
      startTime: session.startTime,
      status: session.status,
    };
  }

  /**
   * Generate a QR token for current time window
   * Token format: sessionId:timeWindow:signature
   * @param sessionId - Session ID
   * @returns QR token and metadata
   */
  async generateQR(sessionId: string): Promise<QRResponse> {
    // Verify session exists and is active
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "ACTIVE") {
      throw new Error("Session is not active");
    }

    // Generate current time window (rotates every 5 seconds)
    const timeWindow = Math.floor(Date.now() / 5000);

    // Generate HMAC signature
    const signature = this.generateSignature(
      sessionId,
      timeWindow,
      session.secret,
    );

    // Calculate time until next rotation
    const currentWindowEnd = (timeWindow + 1) * 5000;
    const expiresIn = currentWindowEnd - Date.now();

    return {
      qr: `${sessionId}:${timeWindow}:${signature}`,
      timeWindow,
      expiresIn,
    };
  }

  /**
   * Verify a QR token and mark attendance
   * @param token - QR token (sessionId:timeWindow:signature)
   * @param studentId - Student ID from authenticated user
   * @returns Attendance record if successful
   */
  async markAttendance(token: string, studentId: number) {
    const [sessionId, timeWindowStr, providedSignature] = token.split(":");

    if (!sessionId || !timeWindowStr || !providedSignature) {
      throw new Error("Invalid token format");
    }

    const timeWindow = parseInt(timeWindowStr, 10);
    if (isNaN(timeWindow)) {
      throw new Error("Invalid time window");
    }

    // Verify session exists and is active
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status !== "ACTIVE") {
      throw new Error("Session is not active");
    }

    // Get current time window
    const currentTimeWindow = Math.floor(Date.now() / 5000);

    // Allow ±1 time window for clock skew tolerance
    const isValidTimeWindow =
      timeWindow >= currentTimeWindow - 1 &&
      timeWindow <= currentTimeWindow + 1;

    if (!isValidTimeWindow) {
      throw new Error(
        `Token expired. Current window: ${currentTimeWindow}, provided: ${timeWindow}`,
      );
    }

    // Verify signature
    const expectedSignature = this.generateSignature(
      sessionId,
      timeWindow,
      session.secret,
    );

    if (providedSignature !== expectedSignature) {
      throw new Error("Invalid token signature");
    }

    // Check if student already marked attendance in this session
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        studentId_attendanceSessionId: {
          studentId,
          attendanceSessionId: sessionId,
        },
      },
    });

    if (existingRecord) {
      throw new Error("Student already marked attendance for this session");
    }

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { userId: studentId },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    // Create attendance record
    const attendanceRecord = await prisma.attendanceRecord.create({
      data: {
        studentId,
        attendanceSessionId: sessionId,
      },
    });

    return {
      id: attendanceRecord.id,
      studentId: attendanceRecord.studentId,
      attendanceSessionId: attendanceRecord.attendanceSessionId,
      markedAt: attendanceRecord.markedAt,
    };
  }

  /**
   * Close an attendance session
   * @param sessionId - Session ID
   * @param staffId - Staff ID (must match session creator)
   */
  async closeSession(sessionId: string, staffId: number): Promise<void> {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.staffId !== staffId) {
      throw new Error("Unauthorized: You did not create this session");
    }

    await prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        status: "CLOSED",
        endTime: new Date(),
      },
    });
  }

  /**
   * Get session info
   * @param sessionId - Session ID
   * @returns Session details
   */
  async getSession(sessionId: string) {
    const session = await prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: { markedAttendances: true },
        },
      },
    });

    if (!session) {
      throw new Error("Session not found");
    }

    return session;
  }

  /**
   * Get attendance records for a session
   * @param sessionId - Session ID
   * @returns List of attendance records
   */
  async getSessionAttendances(sessionId: string) {
    const records = await prisma.attendanceRecord.findMany({
      where: { attendanceSessionId: sessionId },
      include: {
        student: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { markedAt: "desc" },
    });

    return records;
  }

  /**
   * Generate HMAC-SHA256 signature
   * @private
   */
  private generateSignature(
    sessionId: string,
    timeWindow: number,
    secret: string,
  ): string {
    const message = `${sessionId}:${timeWindow}`;
    return crypto
      .createHmac("sha256", secret)
      .update(message)
      .digest("hex")
      .substring(0, 16); // Use first 16 chars for compactness
  }
}

export const attendanceService = new AttendanceService();
