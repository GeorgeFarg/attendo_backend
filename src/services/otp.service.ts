import { prisma } from "@/lib/prisma.ts";
import { sendOtpEmail } from "@/lib/mailer.ts";
import { randomInt } from "crypto";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(length: number = 6): string {
  // return Math.floor(100000 + Math.random() * 900000).toString();
  return randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
}

export async function sendVerificationOtp(email: string) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Remove any existing OTPs for this email
  await prisma.emailVerification.deleteMany({ where: { email } });

  await prisma.emailVerification.create({
    data: { email, otp, expiresAt },
  });

  await sendOtpEmail(email, otp);
}

export async function verifyOtp(email: string, otp: string): Promise<boolean> {
  const record = await prisma.emailVerification.findFirst({
    where: { email, otp },
  });

  if (!record) return false;
  if (record.expiresAt < new Date()) {
    await prisma.emailVerification.delete({ where: { id: record.id } });
    return false;
  }

  await prisma.emailVerification.delete({ where: { id: record.id } });
  return true;
}
