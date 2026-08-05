import express from "express";
import { getGeminiModel } from "./geminiConfig.js";
import { getProductById, searchCatalog } from "./productTools.js";

const llmRouter = express.Router();

const functionResponse = (name, response) => [{ functionResponse: { name, response } }];

llmRouter.post("/chat", async (req, res) => {
  try {
    const userPrompt = typeof req.body?.userPrompt === "string" ? req.body.userPrompt.trim() : "";
    if (!userPrompt) return res.status(400).json({ error: "userPrompt is required" });
    if (userPrompt.length > 2000) return res.status(400).json({ error: "userPrompt is too long" });

    const chatSession = getGeminiModel().startChat();
    let result = await chatSession.sendMessage(userPrompt);
    let lastSearch = null;

    for (let turn = 0; turn < 3; turn += 1) {
      const call = result.response.functionCalls?.()?.[0];
      if (!call) {
        const payload = { reply: result.response.text() };
        if (lastSearch) Object.assign(payload, { action: "searchProducts", products: lastSearch });
        return res.json(payload);
      }

      const args = call.args || {};
      if (call.name === "searchProducts") {
        const products = await searchCatalog(args);
        lastSearch = products;
        result = await chatSession.sendMessage(functionResponse(call.name, {
          products,
          total: products.length,
          instruction: products.length ? "Use these exact products and IDs; ask the user to choose if more than one matches." : "No products matched. Suggest a revised search.",
        }));
        continue;
      }

      if (call.name === "addToCart") {
        const product = await getProductById(args.productId);
        const quantity = Math.max(1, Math.min(Number(args.quantity) || 1, 99));
        if (!product) {
          result = await chatSession.sendMessage(functionResponse(call.name, { ok: false, error: "Product was not found. Search again." }));
          continue;
        }
        return res.json({ action: "addToCart", product, quantity });
      }

      if (call.name === "openProduct") {
        const product = await getProductById(args.productId);
        return product
          ? res.json({ action: "openProduct", product })
          : res.json({ reply: "I couldn't find that product. Try searching by name or model." });
      }

      if (call.name === "openCart") return res.json({ action: "openCart" });
      if (call.name === "checkoutOrder") return res.json({ action: "checkoutOrder", ...args });

      return res.json({ reply: result.response.text() });
    }

    return res.json({ reply: "I couldn't complete that request. Please try a more specific product description." });
  } catch (error) {
    console.error("LLM request failed:", error);
    return res.status(502).json({ error: "Assistant is temporarily unavailable" });
  }
});

export default llmRouter;
