import crypto from "node:crypto";
import { readFile } from "node:fs/promises";
import KnowledgeChunk from "../model/knowledgeChunk.model.js";
import electronicsProduct from "../model/electronics.product.js";
import {
  createEmbeddings,
  getEmbeddingModelName,
} from "./openRouterClient.js";

const contentHash = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");

const productSpecifications = (spec) => {
  if (!spec) return "Not provided";
  const entries = spec instanceof Map ? [...spec.entries()] : Object.entries(spec);
  return entries.length
    ? entries.map(([key, value]) => `${key}: ${String(value)}`).join(", ")
    : "Not provided";
};

const productChunk = (product) => {
  const id = String(product._id);
  const content = [
    `Product: ${product.name}`,
    `Model: ${product.model}`,
    `Category: ${product.category}`,
    `Price: ${product.price} ETB`,
    `Availability: ${product.placment || "not sold"}`,
    `Specifications: ${productSpecifications(product.spec)}`,
  ].join("\n");

  return {
    sourceType: "product",
    sourceId: id,
    title: product.name,
    content,
    metadata: {
      productId: id,
      category: product.category,
      model: product.model,
      price: product.price,
    },
  };
};

const upsertChunks = async (chunks) => {
  if (!chunks.length) return 0;

  const embeddingModel = getEmbeddingModelName();
  const prepared = chunks.map((chunk) => ({
    ...chunk,
    embeddingModel,
    contentHash: contentHash(`${embeddingModel}:${chunk.content}`),
  }));
  const existing = await KnowledgeChunk.find({
    $or: prepared.map((chunk) => ({
      sourceType: chunk.sourceType,
      sourceId: chunk.sourceId,
    })),
  })
    .select("sourceType sourceId contentHash embeddingModel")
    .lean();
  const existingHashes = new Map(
    existing.map((chunk) => [
      `${chunk.sourceType}:${chunk.sourceId}`,
      chunk.contentHash,
    ])
  );
  const pending = prepared.filter(
    (chunk) =>
      existingHashes.get(`${chunk.sourceType}:${chunk.sourceId}`) !==
      chunk.contentHash
  );

  if (!pending.length) return 0;
  const embeddings = await createEmbeddings(pending.map((chunk) => chunk.content));
  if (embeddings.length !== pending.length) {
    throw new Error("Embedding response did not match the requested chunk count");
  }

  await KnowledgeChunk.bulkWrite(
    pending.map((chunk, index) => ({
      updateOne: {
        filter: { sourceType: chunk.sourceType, sourceId: chunk.sourceId },
        update: { $set: { ...chunk, embedding: embeddings[index] } },
        upsert: true,
      },
    }))
  );
  return pending.length;
};

export const syncProductKnowledge = async (product) =>
  upsertChunks([productChunk(product)]);

export const deleteProductKnowledge = async (productId) =>
  KnowledgeChunk.deleteOne({ sourceType: "product", sourceId: String(productId) });

export const indexAllKnowledge = async () => {
  const products = await electronicsProduct.find({}).lean();
  const productChunks = products.map(productChunk);
  const knowledgePath = new URL("../data/knowledge.json", import.meta.url);
  const staticChunks = JSON.parse(await readFile(knowledgePath, "utf8"));
  const indexed = await upsertChunks([...productChunks, ...staticChunks]);
  const productIds = products.map((product) => String(product._id));

  await KnowledgeChunk.deleteMany({
    sourceType: "product",
    ...(productIds.length ? { sourceId: { $nin: productIds } } : {}),
  });

  return { indexed, totalProducts: products.length, staticChunks: staticChunks.length };
};

const cosineSimilarity = (left, right) => {
  if (!left?.length || left.length !== right?.length) return 0;
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;
  for (let index = 0; index < left.length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] ** 2;
    rightMagnitude += right[index] ** 2;
  }
  const denominator = Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude);
  return denominator ? dot / denominator : 0;
};

export const retrieveRelevantKnowledge = async (query, { maxPrice } = {}) => {
  const [queryEmbedding] = await createEmbeddings(query);
  if (!queryEmbedding) return [];

  const topK = Math.min(Math.max(Number(process.env.RAG_TOP_K) || 5, 1), 10);
  const threshold = Math.min(
    Math.max(Number(process.env.RAG_SCORE_THRESHOLD) || 0.25, -1),
    1
  );
  const chunks = await KnowledgeChunk.find({})
    .select("+embedding sourceType sourceId title content metadata")
    .limit(2_000)
    .lean();

  return chunks
    .filter(
      (chunk) =>
        chunk.sourceType !== "product" ||
        !Number.isFinite(Number(maxPrice)) ||
        Number(chunk.metadata?.price) <= Number(maxPrice)
    )
    .map((chunk) => ({
      ...chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }))
    .filter((chunk) => chunk.score >= threshold)
    .sort((left, right) => right.score - left.score)
    .slice(0, topK)
    .map(({ embedding, ...chunk }) => chunk);
};
