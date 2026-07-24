import express from "express";
import { getGeminiModel } from "./geminiConfig.js";

const llmRouter = express.Router();

llmRouter.post("/chat", async (req, res) => {
  try {
    const userPrompt = req.body.userPrompt?.trim();
    if (!userPrompt) {
      return res.status(400).json({ error: "Missing userPrompt" });
    }
    if (userPrompt.length > 2_000) {
      return res.status(400).json({ error: "Prompt is too long" });
    }

    // Keep requests isolated so one shopper can never inherit another shopper's chat.
    const chatSession = getGeminiModel().startChat();
    const result = await chatSession.sendMessage(userPrompt);
    const response = result.response;
    const functionCall = response.functionCalls?.()?.[0];

    if (functionCall?.name === "addToCart") {
      return res.json({ action: "addToCart", ...functionCall.args });
    }
    if (functionCall?.name === "checkoutOrder") {
      return res.json({ action: "checkoutOrder", ...functionCall.args });
    }

    return res.json({ reply: response.text() });
  } catch (error) {
    console.error("Gemini request failed:", error);
    return res.status(502).json({ error: "Assistant is temporarily unavailable" });
  }
});

export default llmRouter;
