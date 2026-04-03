import express from "express";
import { Request, Response } from "express";
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
    credentials: true,
  }),
);

app.use(cookieParser());
app.use(express.json());

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

// 라우터 설정...
app.use("/api/auth", authRouter);
app.use(errorHandler);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Not Found",
  });
});

export default app;
