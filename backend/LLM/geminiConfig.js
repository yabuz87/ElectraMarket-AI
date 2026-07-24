import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const tools = [
  {
    functionDeclarations: [
      {
        name: "addToCart",
        description: "Adds a product to the shopping cart",
        parameters: {
          type: "object",
          properties: {
            productId: { type: "string" },
            quantity: { type: "number" },
          },
          required: ["productId", "quantity"],
        },
      },
      {
        name: "checkoutOrder",
        description: "Starts checkout for the current cart",
        parameters: {
          type: "object",
          properties: {
            shippingAddress: { type: "string" },
            shippingOption: {
              type: "string",
              enum: ["fast", "normal", "slow"],
            },
          },
          required: ["shippingAddress", "shippingOption"],
        },
      },
    ],
  },
];

let model;

export const getGeminiModel = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!model) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      tools,
    });
  }

  return model;
};
