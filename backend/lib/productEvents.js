import crypto from "node:crypto";
import { EventEmitter } from "node:events";
import { createRedisSubscriber, getRedisClient } from "./redis.js";

const emitter = new EventEmitter();
emitter.setMaxListeners(0);
const instanceId = crypto.randomUUID();
let subscriber = null;

const channel = (productId) => `product-events:${productId}`;
const emitLocal = (productId, event) => emitter.emit(channel(productId), event);

export const initializeProductEvents = async () => {
  subscriber = await createRedisSubscriber().catch((error) => {
    console.warn("Distributed product events unavailable:", error.message);
    return null;
  });
  if (!subscriber) return;
  await subscriber.pSubscribe("product-events:*", (message, eventChannel) => {
    try {
      const event = JSON.parse(message);
      if (event.origin === instanceId) return;
      emitLocal(eventChannel.slice("product-events:".length), event);
    } catch (error) {
      console.warn("Ignored invalid product event:", error.message);
    }
  });
};

export const publishProductEvent = (productId, type, data = {}) => {
  const event = { type, productId: String(productId), data, origin: instanceId, timestamp: Date.now() };
  emitLocal(productId, event);
  const redis = getRedisClient();
  if (redis) void redis.publish(channel(productId), JSON.stringify(event)).catch((error) => console.warn("Product event publish failed:", error.message));
};

export const subscribeToProductEvents = (productId, listener) => {
  const eventChannel = channel(productId);
  emitter.on(eventChannel, listener);
  return () => emitter.off(eventChannel, listener);
};

export const closeProductEvents = async () => {
  if (subscriber?.isOpen) await subscriber.quit();
  subscriber = null;
};
