export const config = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || "your-secret-key-change-in-production",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    "your-refresh-secret-change-in-production",
  ACCESS_TOKEN_EXPIRY: "15m", // 15 minutes
  REFRESH_TOKEN_EXPIRY: "7d", // 7 days
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587"),
  SMTP_USER: process.env.SMTP_USER || "your-email@gmail.com",
  SMTP_PASS: process.env.SMTP_PASS || "your-password",
};
