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

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const embeddingBatchSize = () =>
  Math.min(Math.max(Number(process.env.RAG_EMBEDDING_BATCH_SIZE) || 4, 1), 16);

const embeddingRetries = () =>
  Math.min(Math.max(Number(process.env.RAG_EMBEDDING_RETRIES) || 2, 0), 3);

const isRetryableEmbeddingError = (error) =>
  error?.code === "EMBEDDING_COUNT_MISMATCH" ||
  [408, 429, 500, 502, 503, 504, 524, 529].includes(Number(error?.statusCode));

const requestDocumentEmbeddings = async (contents) => {
  let lastError;
  for (let attempt = 0; attempt <= embeddingRetries(); attempt += 1) {
    try {
      return await createEmbeddings(contents, {
        inputType: "search_document",
        timeoutMs: 30_000,
      });
    } catch (error) {
      lastError = error;
      if (!isRetryableEmbeddingError(error) || attempt === embeddingRetries()) break;
      await delay(500 * 2 ** attempt);
    }
  }
  throw lastError;
};

const embedChunksResiliently = async (chunks) => {
  const results = new Array(chunks.length);
  const failures = [];
  const size = embeddingBatchSize();

  for (let start = 0; start < chunks.length; start += size) {
    const batch = chunks.slice(start, start + size);
    try {
      const embeddings = await requestDocumentEmbeddings(
        batch.map((chunk) => chunk.content)
      );
      embeddings.forEach((embedding, index) => {
        results[start + index] = embedding;
      });
      continue;
    } catch (batchError) {
      console.warn(
        `Embedding batch ${start + 1}-${start + batch.length} failed; retrying individually:`,
        batchError.message
      );

      // Authentication, permission and model errors cannot be repaired by
      // splitting the batch. Preserve every chunk for lexical RAG instead.
      if ([400, 401, 402, 403, 404].includes(Number(batchError?.statusCode))) {
        batch.forEach((_, index) => failures.push({ index: start + index, error: batchError }));
        continue;
      }
    }

    for (let index = 0; index < batch.length; index += 1) {
      try {
        [results[start + index]] = await requestDocumentEmbeddings([
          batch[index].content,
        ]);
      } catch (error) {
        failures.push({ index: start + index, error });
      }
    }
  }

  return { embeddings: results, failures };
};

const productSpecifications = (spec) => {
  if (!spec) return "Not provided";
  const entries = spec instanceof Map ? [...spec.entries()] : Object.entries(spec);
  return entries.length
    ? entries
        .map(([key, value]) =>
          `${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`
        )
        .join(", ")
    : "Not provided";
};

const productChunk = (product) => {
  const id = String(product._id);
  const content = [
    `Product: ${product.name}`,
    `Model: ${product.model}`,
    `Category: ${product.category}`,
    `Price: ${product.price} ETB`,
    "Listing status: published",
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

const loadStaticKnowledge = async () => {
  const knowledgePath = new URL("../data/knowledge.json", import.meta.url);
  return JSON.parse(await readFile(knowledgePath, "utf8"));
};

export const syncStaticKnowledgeDocuments = async () => {
  const staticChunks = await loadStaticKnowledge();
  const sourceIds = staticChunks.map((chunk) => chunk.sourceId);
  const existing = await KnowledgeChunk.find({ sourceType: "faq" })
    .select("sourceId content")
    .lean();
  const existingContent = new Map(existing.map((chunk) => [chunk.sourceId, chunk.content]));
  const changed = staticChunks.filter(
    (chunk) => existingContent.get(chunk.sourceId) !== chunk.content
  );

  if (changed.length) {
    await KnowledgeChunk.bulkWrite(changed.map((chunk) => ({
      updateOne: {
        filter: { sourceType: chunk.sourceType, sourceId: chunk.sourceId },
        update: {
          $set: {
            ...chunk,
            embedding: [],
            embeddingModel: "lexical-pending",
            contentHash: contentHash(`lexical-pending:${chunk.content}`),
          },
        },
        upsert: true,
      },
    })));
  }
  await KnowledgeChunk.deleteMany({
    sourceType: "faq",
    sourceId: { $nin: sourceIds },
  });
  return { total: staticChunks.length, changed: changed.length };
};

const upsertChunks = async (chunks) => {
  if (!chunks.length) return { updated: 0, semantic: 0, lexicalFallback: 0 };

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

  if (!pending.length) return { updated: 0, semantic: 0, lexicalFallback: 0 };
  const { embeddings, failures } = await embedChunksResiliently(pending);

  await KnowledgeChunk.bulkWrite(
    pending.map((chunk, index) => ({
      updateOne: {
        filter: { sourceType: chunk.sourceType, sourceId: chunk.sourceId },
        update: {
          $set: embeddings[index]
            ? { ...chunk, embedding: embeddings[index] }
            : {
                ...chunk,
                embedding: [],
                embeddingModel: "lexical-fallback",
                // Keep a different hash so the next indexing run retries it.
                contentHash: contentHash(`lexical-fallback:${chunk.content}`),
              },
        },
        upsert: true,
      },
    }))
  );

  if (failures.length) {
    console.warn(
      `${failures.length} chunk(s) were indexed for lexical search only; semantic embedding will be retried next run.`
    );
  }
  return {
    updated: pending.length,
    semantic: pending.length - failures.length,
    lexicalFallback: failures.length,
  };
};

export const syncProductKnowledge = async (product) =>
  upsertChunks([productChunk(product)]);

export const deleteProductKnowledge = async (productId) =>
  KnowledgeChunk.deleteOne({ sourceType: "product", sourceId: String(productId) });

export const indexAllKnowledge = async () => {
  const products = await electronicsProduct.find({}).lean();
  const productChunks = products.map(productChunk);
  const staticChunks = await loadStaticKnowledge();
  const indexing = await upsertChunks([...productChunks, ...staticChunks]);
  const productIds = products.map((product) => String(product._id));

  await KnowledgeChunk.deleteMany({
    sourceType: "product",
    ...(productIds.length ? { sourceId: { $nin: productIds } } : {}),
  });

  return {
    ...indexing,
    totalProducts: products.length,
    staticChunks: staticChunks.length,
  };
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

const tokenize = (value) =>
  [...new Set(String(value || "").toLowerCase().match(/[a-z0-9]{2,}/g) || [])]
    .filter((token) => !["the", "and", "for", "with", "this", "that"].includes(token))
    .slice(0, 30);

const lexicalScore = (queryTokens, chunk) => {
  if (!queryTokens.length) return 0;
  const title = String(chunk.title || "").toLowerCase();
  const content = String(chunk.content || "").toLowerCase();
  const matchedWeight = queryTokens.reduce((score, token) => {
    if (title.includes(token)) return score + 2;
    if (content.includes(token)) return score + 1;
    return score;
  }, 0);
  return Math.min(matchedWeight / (queryTokens.length * 2), 1);
};

export const retrieveRelevantKnowledge = async (
  query,
  { maxPrice, semantic = true, limit } = {}
) => {
  const topK = Math.min(
    Math.max(Number(limit) || Number(process.env.RAG_TOP_K) || 3, 1),
    3
  );
  const threshold = Math.min(
    Math.max(Number(process.env.RAG_SCORE_THRESHOLD) || 0.25, -1),
    1
  );
  const chunksPromise = KnowledgeChunk.find({})
    .select("+embedding sourceType sourceId title content metadata")
    .limit(2_000)
    .lean();
  const embeddingPromise = semantic
    ? createEmbeddings(query, { inputType: "search_query" }).catch((error) => {
        console.warn("Semantic RAG unavailable; using lexical retrieval:", error.message);
        return [];
      })
    : Promise.resolve([]);
  const [chunks, embeddings] = await Promise.all([chunksPromise, embeddingPromise]);
  const [queryEmbedding] = embeddings;
  const queryTokens = tokenize(query);

  return chunks
    .filter(
      (chunk) =>
        chunk.sourceType !== "product" ||
        !Number.isFinite(Number(maxPrice)) ||
        Number(chunk.metadata?.price) <= Number(maxPrice)
    )
    .map((chunk) => ({
      ...chunk,
      vectorScore: queryEmbedding
        ? cosineSimilarity(queryEmbedding, chunk.embedding)
        : 0,
      lexicalScore: lexicalScore(queryTokens, chunk),
    }))
    .map((chunk) => ({
      ...chunk,
      score: queryEmbedding
        ? chunk.vectorScore * 0.82 + chunk.lexicalScore * 0.18
        : chunk.lexicalScore,
    }))
    .filter(
      (chunk) =>
        chunk.vectorScore >= threshold || chunk.lexicalScore >= 0.25
    )
    .sort((left, right) => right.score - left.score)
    .slice(0, topK)
    .map(({ embedding, vectorScore, lexicalScore: _lexicalScore, ...chunk }) => chunk);
};
