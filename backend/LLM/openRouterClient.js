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

const clampTimeout = (value, fallback, minimum, maximum) =>
  Math.min(Math.max(Number(value) || fallback, minimum), maximum);

const request = async (path, body, { timeoutMs = 18_000 } = {}) => {
  const config = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

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
      error.statusCode = response.status;
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

export const createChatCompletion = async ({
  messages,
  tools = [],
  temperature = 0.3,
  maxTokens = 900,
  maxToolCalls,
  timeoutMs = clampTimeout(process.env.OPENROUTER_CHAT_TIMEOUT_MS, 25_000, 5_000, 30_000),
}) => {
  const { chatModel } = getConfig();
  const requestBody = {
    model: chatModel,
    messages,
    temperature,
    max_tokens: maxTokens,
  };

  // Many free OpenRouter models answer normal chat well but do not implement
  // function calling. Only send tool fields when this request actually needs them.
  if (Array.isArray(tools) && tools.length) {
    requestBody.tools = tools;
    requestBody.tool_choice = "auto";
    requestBody.parallel_tool_calls = false;
  }
  if (Number.isFinite(Number(maxToolCalls))) {
    requestBody.max_tool_calls = Math.min(Math.max(Number(maxToolCalls), 1), 5);
  }

  const payload = await request("/chat/completions", requestBody, { timeoutMs });

  const message = payload.choices?.[0]?.message;
  if (!message) throw new Error("OpenRouter returned an empty chat response");
  const content = Array.isArray(message.content)
    ? message.content
        .filter((part) => part?.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("\n")
    : message.content;
  return { ...message, content: typeof content === "string" ? content : "" };
};

export const createTextCompletion = async (messages, options = {}) =>
  createChatCompletion({
    messages,
    tools: [],
    temperature: options.temperature ?? 0.35,
    maxTokens: options.maxTokens ?? 900,
    timeoutMs: options.timeoutMs,
  });

export const createWebSearchCompletion = async (messages, options = {}) => {
  if (String(process.env.OPENROUTER_WEB_SEARCH_ENABLED).toLowerCase() !== "true") {
    const error = new Error("OpenRouter web search is disabled");
    error.code = "WEB_SEARCH_DISABLED";
    throw error;
  }

  const maxResults = Math.min(
    Math.max(Number(process.env.OPENROUTER_WEB_SEARCH_MAX_RESULTS) || 3, 1),
    5
  );
  return createChatCompletion({
    messages,
    tools: [
      {
        type: "openrouter:web_search",
        parameters: {
          engine: process.env.OPENROUTER_WEB_SEARCH_ENGINE || "auto",
          max_results: maxResults,
          max_total_results: maxResults,
          max_uses: 1,
          search_context_size: "low",
        },
      },
    ],
    maxToolCalls: 1,
    temperature: 0.2,
    maxTokens: options.maxTokens || 800,
    timeoutMs: options.timeoutMs || 30_000,
  });
};

export const createEmbeddings = async (input, options = {}) => {
  const values = Array.isArray(input) ? input : [input];
  if (!values.length) return [];

  const { embeddingModel } = getConfig();
  const payload = await request(
    "/embeddings",
    {
      model: embeddingModel,
      // Some providers behind OpenRouter handle a scalar more reliably than a
      // one-element array, even though both forms are valid API inputs.
      input: values.length === 1 ? values[0] : values,
      encoding_format: "float",
      ...(options.inputType ? { input_type: options.inputType } : {}),
    },
    {
      timeoutMs:
        options.timeoutMs ??
        clampTimeout(process.env.OPENROUTER_EMBEDDING_TIMEOUT_MS, 15_000, 5_000, 30_000),
    }
  );

  const embeddings = (payload.data || [])
    .filter((item) => Number.isInteger(item?.index) && Array.isArray(item.embedding))
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);

  if (embeddings.length !== values.length || embeddings.some((value) => !value.length)) {
    const error = new Error(
      `Embedding provider returned ${embeddings.length} vector(s) for ${values.length} input(s)`
    );
    error.code = "EMBEDDING_COUNT_MISMATCH";
    throw error;
  }

  return embeddings;
};

export const getEmbeddingModelName = () => getConfig().embeddingModel;

export const getOpenRouterStatus = () => ({
  configured: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
  chatModel: process.env.OPENROUTER_MODEL || "openrouter/free",
  embeddingModel:
    process.env.OPENROUTER_EMBEDDING_MODEL ||
    "nvidia/llama-nemotron-embed-vl-1b-v2:free",
  webSearchEnabled:
    String(process.env.OPENROUTER_WEB_SEARCH_ENABLED).toLowerCase() === "true",
});
