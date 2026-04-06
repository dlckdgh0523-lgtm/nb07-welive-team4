import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: "postgresql://postgres:postgres@localhost:5433/welive",
  },
});
