/**
 * Attendance System Types
 */

export interface AttendanceSessionPayload {
  sessionId: string;
  secret: string;
  startTime: Date;
  status: "ACTIVE" | "CLOSED";
}

export interface QRTokenPayload {
  sessionId: string;
  timeWindow: number;
  signature: string;
}

export interface QRResponse {
  qr: string;
  timeWindow: number;
  expiresIn: number; // milliseconds until next rotation
}

export interface AttendanceMarkRequest {
  token: string;
}

export interface AttendanceRecordPayload {
  id: string;
  studentId: number;
  attendanceSessionId: string;
  markedAt: Date;
}

export interface JWTPayload {
  userId: number;
  email: string;
  role: "PROFESSOR" | "MANAGER" | "ASSISTANT" | "STUDENT";
}
