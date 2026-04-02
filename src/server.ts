import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { getEnv } from "./config/env.js";
import uploadRouter from "./routes/upload.route.js";
import dbRouter from "./routes/db.route.js";
import { db } from "./lib/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.route.js";

const env = getEnv();
const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    ok: true,
    service: "codequest-api",
    env: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/ping", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "pong",
    success: true,
  });
});

app.use("/api", uploadRouter);
app.use("/api", dbRouter);
app.use("/api/auth", authRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
  });
});

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`[BOOT] api is running on port ${env.PORT}`);
});

server.on("listening", () => {
  console.log("[SERVER] listening");
});

server.on("close", () => {
  console.log("[SERVER] close");
});

server.on("error", (err) => {
  console.error("[SERVER ERROR]", err);
});

const shutdown = async (signal: string) => {
  console.log(`[SHUTDOWN] signal=${signal}`);

  server.close(async () => {
    try {
      await db.end();
      console.log("[DB] pool closed");
      process.exit(0);
    } catch (error) {
      console.error("[SHUTDOWN ERROR]", error);
      process.exit(1);
    }
  });
};

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("exit", (code) => {
  console.log(`[PROCESS EXIT] code=${code}`);
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});
