// index.ts
import express from "express";
import type { Express, Request, Response } from "express";

const app: Express = express();
const port = 5000;

app.get("/", (_: Request, res: Response) => {
  res.send("The API is running");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
