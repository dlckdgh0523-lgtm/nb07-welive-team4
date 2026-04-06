import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const dbPort = Number(process.env.DB_PORT ?? 5432);

if (Number.isNaN(dbPort)) {
  throw new Error("DB_PORT must be a number");
}

const sslEnabled = process.env.DB_SSL === "true";

export const db = new Pool({
  host: process.env.DB_HOST,
  port: dbPort,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});