import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pgPkg from "pg";
import "dotenv/config";

const { Pool } = pgPkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 동시 연결 최대 개수 (대용량 처리 시 여유 있게 설정)
  idleTimeoutMillis: 30000, // 사용되지 않는 연결 해제 대기 시간
  connectionTimeoutMillis: 5000, // 연결 시도 타임아웃 (5초)
  maxUses: 7500, // 하나의 연결이 재사용될 수 있는 횟수 (메모리 누수 방지)
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "stdout", level: "query" }, // 대용량 쿼리가 잘 날아가는지 확인용
    { emit: "stdout", level: "error" },
    { emit: "stdout", level: "info" },
    { emit: "stdout", level: "warn" },
  ],
});

export default prisma;
