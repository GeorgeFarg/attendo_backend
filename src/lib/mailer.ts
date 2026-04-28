import nodemailer from "nodemailer";
import { config } from "../config/env.ts";

if (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS) {
  throw new Error("SMTP configuration is missing");
}

export const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  secure: false,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
} as any);

export async function sendOtpEmail(to: string, otp: string) {
  await transporter.sendMail({
    from: `"Attendo:" <${config.SMTP_USER}>`,
    to,
    subject: "Your verification code",
    text: `Your OTP is: ${otp}. It expires in 10 minutes.`,
    html: `<p>Your OTP is: <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
  });
}

export async function sendPasswordEmail(to: string, password: string) {
  await transporter.sendMail({
    from: `"Attendo:" <${config.SMTP_USER}>`,
    to,
    subject: "Your user password",
    text: `Your password is: ${password}. It expires in 10 minutes.`,
    html: `<p>Your password is: <strong>${password}</strong></p>`,
  });
}
