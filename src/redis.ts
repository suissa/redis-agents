import Redis from "ioredis";

export const createRedisClient = () => {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  return new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
};

export type RedisClient = ReturnType<typeof createRedisClient>;
