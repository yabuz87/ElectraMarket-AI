import mongoose from "mongoose";
import electronicsProduct from "../model/electronics.product.js";
import ProductComment from "../model/productComment.model.js";
import { setProductLikeState } from "../lib/productLikes.js";
import { publishProductEvent } from "../lib/productEvents.js";
import { getProductById, searchCatalog } from "./productTools.js";

export const assistantTools = [
  {
    type: "function",
    function: {
      name: "getMyAccount",
      description: "Get a minimal overview of the signed-in viewer account.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "searchProducts",
      description:
        "Search the live product-listing catalog by keywords, category, model, and asking price.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          category: { type: "string" },
          model: { type: "string" },
          minPrice: { type: "number", minimum: 0 },
          maxPrice: { type: "number", minimum: 0 },
          limit: { type: "integer", minimum: 1, maximum: 8 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProductDetails",
      description:
        "Load an exact listing, including public owner contact information, from the live catalog.",
      parameters: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "setProductLike",
      description:
        "Set an exact listing to liked or not liked for the signed-in viewer. Use only for an explicit command.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          liked: { type: "boolean" },
        },
        required: ["productId", "liked"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "commentOnProduct",
      description:
        "Post the viewer's exact supplied public comment on a listing. Never invent or rewrite the text.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          content: { type: "string", minLength: 2, maxLength: 1000 },
        },
        required: ["productId", "content"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openProduct",
      description: "Open an exact product-listing page after identifying the product.",
      parameters: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
        additionalProperties: false,
      },
    },
  },
];

const authenticationRequired = () => ({
  result: {
    ok: false,
    code: "AUTHENTICATION_REQUIRED",
    error: "The viewer must log in to use this feature",
  },
});

export const executeAssistantTool = async (name, args = {}, context = {}) => {
  if (name === "getMyAccount") {
    if (!context.user) return authenticationRequired();
    return {
      result: {
        ok: true,
        account: {
          fullName: context.user.fullName,
          status: context.user.status,
          emailVerified: Boolean(context.user.isVerified),
        },
      },
    };
  }

  if (name === "searchProducts") {
    const products = await searchCatalog(args);
    return { result: { ok: true, total: products.length, products }, products };
  }

  if (name === "getProductDetails") {
    const product = await getProductById(args.productId);
    return {
      result: product
        ? { ok: true, product }
        : { ok: false, error: "Product not found" },
    };
  }

  if (name === "setProductLike") {
    if (!context.user) return authenticationRequired();
    if (!mongoose.isValidObjectId(args.productId)) {
      return { result: { ok: false, error: "Product not found" } };
    }

    const shouldBeLiked = args.liked === true;
    const state = await setProductLikeState(args.productId, context.user._id, shouldBeLiked);
    if (!state) return { result: { ok: false, error: "Product not found" } };
    const { liked, count, product } = state;
    return {
      result: {
        ok: true,
        message: liked
          ? `You liked ${product.name}.`
          : `You removed your like from ${product.name}.`,
        liked,
        count,
      },
      action: { type: "syncProductLike", productId: String(product._id), liked, count },
    };
  }

  if (name === "commentOnProduct") {
    if (!context.user) return authenticationRequired();
    if (!mongoose.isValidObjectId(args.productId)) {
      return { result: { ok: false, error: "Product not found" } };
    }
    const content = typeof args.content === "string" ? args.content.trim() : "";
    if (content.length < 2 || content.length > 1000) {
      return { result: { ok: false, error: "A comment must contain 2 to 1000 characters" } };
    }

    const product = await electronicsProduct.findById(args.productId).select("name").lean();
    if (!product) return { result: { ok: false, error: "Product not found" } };

    let comment = await ProductComment.findOne({
      productId: product._id,
      authorId: context.user._id,
      content,
      createdAt: { $gte: new Date(Date.now() - 60_000) },
    }).lean();
    const duplicatePrevented = Boolean(comment);
    if (!comment) {
      comment = (await ProductComment.create({
        productId: product._id,
        authorId: context.user._id,
        content,
      })).toObject();
      publishProductEvent(product._id, "comment.created", { commentId: String(comment._id) });
    }

    return {
      result: {
        ok: true,
        message: duplicatePrevented
          ? `That comment is already posted on ${product.name}.`
          : `Your comment was posted on ${product.name}.`,
        duplicatePrevented,
      },
      action: {
        type: "commentCreated",
        productId: String(product._id),
        commentId: String(comment._id),
      },
    };
  }

  if (name === "openProduct") {
    const product = await getProductById(args.productId);
    if (!product) return { result: { ok: false, error: "Product not found" } };
    return {
      result: { ok: true, product },
      action: { type: "openProduct", productId: product.id },
    };
  }

  return { result: { ok: false, error: "Unsupported tool" } };
};
