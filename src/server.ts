import "dotenv/config";
import { getEnv } from "./config/env";
import { db } from "./lib/db";
import app from "./app";
import { startPollScheduler } from "./utils/poll.scheduler";

const env = getEnv();

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`[BOOT] api is running on port ${env.PORT}`);
  startPollScheduler();
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
