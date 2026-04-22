import IORedis from 'ioredis';
import { env } from '../config/env';

export function createRedisPub(): IORedis {
  return new IORedis(env.REDIS_URL);
}

export function createRedisSub(): IORedis {
  return new IORedis(env.REDIS_URL);
}

export function createRedisQueueConnection(): IORedis {
  return new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });
}
