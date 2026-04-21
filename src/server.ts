import "dotenv/config";
import { getEnv } from "./config/env";
import { db } from "./lib/db";
import app from "./app";
import { createRedisPub, createRedisSub } from "./lib/redis";
import { createNotificationQueue } from "./queue/notification.queue";
import { startNotificationWorker } from "./workers/notification.worker";
import { initNotificationRealtime, subscribeNotificationChannel } from "./services/notification-realtime.service";
import { startOtel, shutdownOtel } from "./lib/otel";
import { startPollScheduler } from "./utils/poll.scheduler";

const env = getEnv();

startOtel();

const redisPub = createRedisPub();
const redisSub = createRedisSub();

initNotificationRealtime(redisPub, redisSub);
createNotificationQueue();
startNotificationWorker();
void subscribeNotificationChannel();

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
      await shutdownOtel();
      await redisPub.quit();
      await redisSub.quit();
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
