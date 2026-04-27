import { prisma } from "@/lib/prisma.ts";
import { sendOtpEmail } from "@/lib/mailer.ts";
import { randomInt } from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(length: number = 6): string {
  // return Math.floor(100000 + Math.random() * 900000).toString();
  return randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
}

export async function sendPasswordResetOtp(userId: number, email: string) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Remove any existing OTPs for this email
  await prisma.oTPVerification.deleteMany({ where: { userId } });

  await prisma.oTPVerification.create({
    data: { userId, otp, expiresAt },
  });

  await sendOtpEmail(email, otp);
}

export async function verifyPasswordResetOtp(
  email: string,
  otp: string,
): Promise<boolean> {
  const record = await prisma.oTPVerification.findFirst({
    where: {
      user: {
        email,
      },
      otp,
    },
  });

  if (!record) return false;
  if (record.expiresAt < new Date()) {
    await prisma.oTPVerification.delete({ where: { id: record.id } });
    return false;
  }

  await prisma.oTPVerification.delete({ where: { id: record.id } });
  return true;
}
