import dotenv from "dotenv";

dotenv.config();

export const shoppingTools = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description: "Search the store catalog using a natural-language request. Always use this before selecting a product by name.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" }, category: { type: "string" }, model: { type: "string" },
          minPrice: { type: "number" }, maxPrice: { type: "number" }, limit: { type: "number" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addToCart",
      description: "Request adding one exact catalog product to the user's cart. Only call after searchProducts and an explicit add/buy request.",
      parameters: {
        type: "object",
        properties: { productId: { type: "string" }, quantity: { type: "number" } },
        required: ["productId", "quantity"],
      },
    },
  },
  { type: "function", function: { name: "openCart", description: "Open the cart when explicitly requested.", parameters: { type: "object", properties: {} } } },
  {
    type: "function",
    function: {
      name: "openProduct",
      description: "Open a specific catalog product page after searchProducts identifies it.",
      parameters: { type: "object", properties: { productId: { type: "string" } }, required: ["productId"] },
    },
  },
  {
    type: "function",
    function: {
      name: "checkoutOrder",
      description: "Start checkout for the current cart when explicitly requested.",
      parameters: {
        type: "object",
        properties: { shippingAddress: { type: "string" }, shippingOption: { type: "string", enum: ["fast", "normal", "slow"] } },
        required: ["shippingAddress", "shippingOption"],
      },
    },
  },
];

export const getOpenRouterConfig = () => {
  if (!process.env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is not configured");
  return {
    apiKey: process.env.OPENROUTER_API_KEY,
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
    siteUrl: process.env.OPENROUTER_SITE_URL,
    appName: process.env.OPENROUTER_APP_NAME || "ElectraStore",
  };
};
