// index.ts
import type { Request, Response } from "express";
import { app } from "./app.ts";

const port = 5000;

app.get("/", (_: Request, res: Response) => {
  res.send("The API is running");
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
