// index.ts
import type { NextFunction, Request, Response } from "express";
import { app } from "./app.ts";
import { Prisma } from "./generated/prisma/client.ts";
import { ZodError } from "zod";

const port = 5000;

app.get("/", (_: Request, res: Response) => {
  res.send("The API is running");
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaErrorCode = err.code;
    if (prismaErrorCode === "P2002") {
      res.status(409).json({ message: "Resource already exists" });
      return;
    }

    if (prismaErrorCode === "P2025") {
      res.status(404).json({ message: "Resource not found" });
      return;
    }
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  const loweredMessage = message.toLowerCase();
  const statusCode = loweredMessage.includes("not found")
    ? 404
    : loweredMessage.includes("already")
      ? 409
      : loweredMessage.includes("invalid")
        ? 400
        : 500;

  if (statusCode === 500) {
    console.error("Unhandled error:", err);
  }

  res.status(statusCode).json({ message });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
