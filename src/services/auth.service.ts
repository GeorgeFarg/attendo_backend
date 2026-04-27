import { prisma } from "@/lib/prisma.ts";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt.ts";
import type { RegisterInput } from "@/validators/auth.schema.ts";
import bcrypt from "bcrypt";

export async function createUserSession(
  userId: number,
  remember: boolean = false,
) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  return {
    accessToken,
    refreshToken,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) throw new Error("Invalid email");

  const hashedPassword = user.passwordHash;
  const isMatch = await bcrypt.compare(password, hashedPassword);
  if (!isMatch) {
    throw new Error("Invalid password");
  }
  return user;
}
