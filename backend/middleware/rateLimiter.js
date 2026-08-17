import { getRedisClient } from "../lib/redis.js";

const localWindows = new Map();
let lastCleanup = 0;

const localIncrement = (key, windowMs) => {
  const now = Date.now();
  if (now - lastCleanup > windowMs) {
    for (const [entryKey, entry] of localWindows) {
      if (entry.expiresAt <= now) localWindows.delete(entryKey);
    }
    lastCleanup = now;
  }
  const current = localWindows.get(key);
  if (!current || current.expiresAt <= now) {
    const entry = { count: 1, expiresAt: now + windowMs };
    localWindows.set(key, entry);
    return entry;
  }
  current.count += 1;
  return current;
};

export const rateLimit = ({ name, windowMs, max }) => async (req, res, next) => {
  const identity = req.ip || req.socket.remoteAddress || "unknown";
  const bucket = Math.floor(Date.now() / windowMs);
  const key = `ratelimit:${name}:${identity}:${bucket}`;
  let count;
  let resetAt = (bucket + 1) * windowMs;

  try {
    const redis = getRedisClient();
    if (redis) {
      count = await redis.incr(key);
      if (count === 1) await redis.pExpire(key, windowMs);
      const ttl = await redis.pTTL(key);
      if (ttl > 0) resetAt = Date.now() + ttl;
    } else {
      const entry = localIncrement(key, windowMs);
      count = entry.count;
      resetAt = entry.expiresAt;
    }
  } catch (error) {
    console.warn("Rate limiter fallback used:", error.message);
    const entry = localIncrement(key, windowMs);
    count = entry.count;
    resetAt = entry.expiresAt;
  }

  res.setHeader("RateLimit-Limit", max);
  res.setHeader("RateLimit-Remaining", Math.max(max - count, 0));
  res.setHeader("RateLimit-Reset", Math.ceil(resetAt / 1000));
  if (count > max) {
    res.setHeader("Retry-After", Math.max(Math.ceil((resetAt - Date.now()) / 1000), 1));
    return res.status(429).json({ message: "Too many requests. Please try again shortly." });
  }
  return next();
};
