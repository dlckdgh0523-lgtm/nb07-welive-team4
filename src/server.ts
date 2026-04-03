import { getEnv } from "./config/env";
import app from "./app";

const env = getEnv();

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
