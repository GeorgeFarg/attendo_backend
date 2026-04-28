import { z } from "zod";

/**
 * Validation schema for attendance marking
 */
export const attendanceMarkSchema = z.object({
  token: z
    .string()
    .min(1, "Token is required")
    .trim()
    .refine(
      (val) => val.includes(":") && val.split(":").length === 3,
      "Invalid token format. Expected: sessionId:timeWindow:signature",
    ),
});

export type AttendanceMarkInput = z.infer<typeof attendanceMarkSchema>;
