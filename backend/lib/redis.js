import { createClient } from "redis";

let redisClient = null;
let redisReady = false;

export const initializeRedis = async () => {
  const url = process.env.REDIS_URL?.trim();
  if (!url || redisReady) return redisReady;

  const client = createClient({
    url,
    socket: {
      connectTimeout: 5_000,
      reconnectStrategy: (retries) => Math.min(retries * 250, 3_000),
    },
  });
  client.on("error", (error) => console.warn("Redis error:", error.message));

  try {
    await client.connect();
    redisClient = client;
    redisReady = true;
    console.log("Redis connected");
  } catch (error) {
    console.warn("Redis unavailable; using single-instance fallbacks:", error.message);
    await client.disconnect().catch(() => {});
  }
  return redisReady;
};

export const getRedisClient = () => (redisReady ? redisClient : null);

export const createRedisSubscriber = async () => {
  if (!redisReady || !redisClient) return null;
  const subscriber = redisClient.duplicate();
  subscriber.on("error", (error) => console.warn("Redis subscriber error:", error.message));
  await subscriber.connect();
  return subscriber;
};

export const closeRedis = async () => {
  if (redisClient?.isOpen) await redisClient.quit();
  redisClient = null;
  redisReady = false;
};
