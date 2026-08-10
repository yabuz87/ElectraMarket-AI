import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connect from "./lib/mongodb.js";
import buyerRouter from "./router/buyerRouter.js";
import orderRouter from "./router/orderRouter.js";
import productRouter from "./router/productRouters.js";
import salerRouter from "./router/salerRouter.js";
import assistantRouter from "./LLM/assistantRouter.js";

const app = express();
const port = Number(process.env.PORT) || 4500;
const allowedOrigins = (process.env.CLIENT_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "12mb" }));
app.use(express.urlencoded({ extended: true, limit: "12mb" }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.status(200).json({ status: "ok" }));
app.use("/buyer", buyerRouter);
app.use("/saler", salerRouter);
app.use("/product", productRouter);
app.use("/order", orderRouter);
app.use("/assistant", assistantRouter);

app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.statusCode) || 500;
  res.status(status).json({ message: status === 500 ? "Internal server error" : error.message });
});

const start = async () => {
  await connect();
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`));
};

start().catch((error) => {
  console.error("Backend startup failed:", error.message);
  process.exitCode = 1;
});

export default app;
