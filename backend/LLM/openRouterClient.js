const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

const getConfig = () => {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    const error = new Error("OPENROUTER_API_KEY is not configured");
    error.statusCode = 503;
    throw error;
  }

  return {
    apiKey,
    baseUrl: (process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, ""),
    chatModel: process.env.OPENROUTER_MODEL || "openrouter/free",
    embeddingModel:
      process.env.OPENROUTER_EMBEDDING_MODEL ||
      "nvidia/llama-nemotron-embed-vl-1b-v2:free",
  };
};

const request = async (path, body) => {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(process.env.OPENROUTER_SITE_URL
          ? { "HTTP-Referer": process.env.OPENROUTER_SITE_URL }
          : {}),
        "X-Title": process.env.OPENROUTER_APP_NAME || "ElectraStore",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(
        payload.error?.message || `OpenRouter request failed (${response.status})`
      );
      error.statusCode = response.status === 429 ? 429 : 502;
      throw error;
    }
    return payload;
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("OpenRouter request timed out");
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const createChatCompletion = async ({ messages, tools }) => {
  const { chatModel } = getConfig();
  const payload = await request("/chat/completions", {
    model: chatModel,
    messages,
    tools,
    tool_choice: "auto",
    parallel_tool_calls: false,
    temperature: 0.2,
    max_tokens: 700,
  });

  const message = payload.choices?.[0]?.message;
  if (!message) throw new Error("OpenRouter returned an empty chat response");
  return message;
};

export const createEmbeddings = async (input) => {
  const values = Array.isArray(input) ? input : [input];
  if (!values.length) return [];

  const { embeddingModel } = getConfig();
  const payload = await request("/embeddings", {
    model: embeddingModel,
    input: values,
    encoding_format: "float",
  });

  return (payload.data || [])
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);
};

export const getEmbeddingModelName = () => getConfig().embeddingModel;
