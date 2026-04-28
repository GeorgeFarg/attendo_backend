import { z } from "zod";

export const createUserSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("student"),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    studentCode: z.string(),
    classId: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("staff"),
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["PROFESSOR", "MANAGER", "ASSISTANT"]),
  }),
]);

export type CreateUserInput = z.infer<typeof createUserSchema>;
