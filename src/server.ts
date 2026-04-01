import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { getEnv } from "./config/env.js";
import authRouter from "./routes/auth.route";
import { errorHandler } from "./middlewares/errorHandler";

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

app.use("/api/auth", authRouter);

// 전역 에러 핸들러
app.use(errorHandler);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
  });
});

const server = app.listen(env.PORT, () => {
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

process.on("exit", (code) => {
  console.log(`[PROCESS EXIT] code=${code}`);
});

process.on("uncaughtException", (err) => {
  console.error("[UNCAUGHT EXCEPTION]", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[UNHANDLED REJECTION]", reason);
});
