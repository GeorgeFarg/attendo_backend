// index.ts
import express from "express";
import AuthRouter from "@/routes/auth.routes.ts";
import UserRouter from "@/routes/user.routes.ts";
import AttendanceRouter from "@/routes/attendance.routes.ts";
import { Authenticate } from "./middlewares/auth.middleware.ts";

import type { Express, Request, Response } from "express";

const app: Express = express();

app.use(express.json());

// Middleware for parsing URL-encoded form data
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next) => {
  const start = Date.now();
  const rawBody =
    req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
      ? JSON.stringify(req.body)
      : null;
  const { method, originalUrl } = req;
  let logText = `[REQUEST] ${method} ${originalUrl} | Query: ${JSON.stringify(
    req.query,
  )}`;
  if (rawBody) logText += ` | Body: ${rawBody}`;

  console.log(logText);

  // Capture response data and status
  const defaultSend = res.send;
  let responseBody: any;
  res.send = function (body) {
    responseBody = body;
    return defaultSend.apply(this, arguments as any);
  };

  res.on("finish", () => {
    const ms = Date.now() - start;
    let responseData;
    try {
      responseData =
        typeof responseBody === "string"
          ? JSON.parse(responseBody)
          : responseBody;
    } catch {
      responseData = responseBody;
    }
    console.log(
      `[RESPONSE] ${method} ${originalUrl} | Status: ${res.statusCode} | Time: ${ms}ms | Response: ${JSON.stringify(
        responseData,
      )}`,
    );
  });

  next();
});

app.use("/api/auth", AuthRouter);
app.use(Authenticate);
app.use("/api/user", UserRouter);
app.use("/api/attendance", AttendanceRouter);
export { app };
