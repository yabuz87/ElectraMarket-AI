import "dotenv/config";
import mongoose from "mongoose";
import connect from "../lib/mongodb.js";
import { indexAllKnowledge } from "../LLM/ragService.js";

try {
  await connect();
  const result = await indexAllKnowledge();
  console.log(
    `RAG index ready: ${result.indexed} updated, ${result.totalProducts} products, ${result.staticChunks} static chunks`
  );
} catch (error) {
  console.error(`RAG indexing failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
