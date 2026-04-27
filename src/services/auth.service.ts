import { prisma } from "@/lib/prisma.ts";
import { generateAccessToken, generateRefreshToken } from "@/lib/jwt.ts";
import type { RegisterInput } from "@/validators/auth.schema.ts";
import bcrypt from "bcrypt";
import type { User } from "@/types/user.d.ts";

export async function createUserSession(user: User, remember: boolean = false) {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user.id);

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
