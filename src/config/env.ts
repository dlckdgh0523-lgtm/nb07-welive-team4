



export interface Env {
  NODE_ENV: string;
  PORT: number;
  CORS_ORIGIN: string;
}

export function getEnv(): Env {
  const port = Number(process.env.PORT ?? 3000);

  if (Number.isNaN(port)) {
    throw new Error("PORT must be a number");
  }

  return {
    NODE_ENV: process.env.NODE_ENV ?? "development",
    PORT: port,
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? "*",
  };
}