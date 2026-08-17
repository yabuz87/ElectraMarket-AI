import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import helmet from "helmet";
import mongoose from "mongoose";
import crypto from "node:crypto";
import connect from "./lib/mongodb.js";
import buyerRouter from "./router/buyerRouter.js";
import productRouter from "./router/productRouters.js";
import salerRouter from "./router/salerRouter.js";
import assistantRouter from "./LLM/assistantRouter.js";
import { syncStaticKnowledgeDocuments } from "./LLM/ragService.js";
import { closeRedis, initializeRedis } from "./lib/redis.js";
import { closeProductEvents, initializeProductEvents } from "./lib/productEvents.js";
import { rateLimit } from "./middleware/rateLimiter.js";

const app = express();
const port = Number(process.env.PORT) || 4500;
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS) || 1);
app.use((req, res, next) => {
  req.requestId = req.get("x-request-id") || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression({
  filter: (req, res) => req.path.includes("/events/") ? false : compression.filter(req, res),
}));
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    const error = new Error("Origin is not allowed by CORS");
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
}));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.get("/health/live", (_req, res) => res.status(200).json({ status: "alive" }));
app.get("/health/ready", (_req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({ status: databaseReady ? "ready" : "not-ready", database: databaseReady ? "connected" : "disconnected" });
});
app.use(rateLimit({ name: "api", windowMs: 15 * 60_000, max: Number(process.env.API_RATE_LIMIT) || 500 }));
app.use("/buyer", rateLimit({ name: "buyer-auth", windowMs: 15 * 60_000, max: Number(process.env.AUTH_RATE_LIMIT) || 100 }), buyerRouter);
app.use("/saler", rateLimit({ name: "seller-auth", windowMs: 15 * 60_000, max: Number(process.env.AUTH_RATE_LIMIT) || 100 }), salerRouter);
app.use("/product", (req, res, next) => {
  const cacheable = req.method === "GET" && !req.path.startsWith("/like/") && !req.path.startsWith("/events/");
  if (cacheable) res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=120");
  next();
});
app.use("/product", productRouter);
app.use("/assistant", rateLimit({ name: "assistant", windowMs: 60_000, max: Number(process.env.ASSISTANT_RATE_LIMIT) || 20 }), assistantRouter);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.statusCode) || 500;
  res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
});

const start = async () => {
  await connect();
  await initializeRedis();
  await initializeProductEvents();
  const server = app.listen(port, () => console.log(`API listening on port ${port}`));

  // Knowledge synchronization is useful but not required to serve traffic.
  // Running it after listen keeps deployments and health probes independent
  // from indexing latency or a temporarily unavailable embedding provider.
  void syncStaticKnowledgeDocuments().catch((error) =>
    console.warn("Static RAG document sync skipped:", error.message)
  );

  const shutdown = async (signal) => {
    console.log(`${signal} received; shutting down gracefully`);
    server.close(async () => {
      await closeProductEvents().catch(() => {});
      await closeRedis().catch(() => {});
      await mongoose.disconnect().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));
};

start().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exitCode = 1;
});

export default app;
