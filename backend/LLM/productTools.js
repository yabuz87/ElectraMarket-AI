import mongoose from "mongoose";
import electronicsProduct from "../model/electronics.product.js";

const MAX_RESULTS = 8;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchCatalog = async ({
  query = "",
  category = "",
  model = "",
  minPrice,
  maxPrice,
  limit = MAX_RESULTS,
} = {}) => {
  const filters = [];
  const text = String(query || "").trim();
  if (text) {
    const expression = new RegExp(escapeRegex(text), "i");
    filters.push({ $or: [{ name: expression }, { description: expression }, { category: expression }, { model: expression }] });
  }
  if (category) filters.push({ category: new RegExp(escapeRegex(category), "i") });
  if (model) filters.push({ model: new RegExp(escapeRegex(model), "i") });

  const price = {};
  if (Number.isFinite(Number(minPrice))) price.$gte = Number(minPrice);
  if (Number.isFinite(Number(maxPrice))) price.$lte = Number(maxPrice);
  if (Object.keys(price).length) filters.push({ price });

  const safeLimit = Math.min(Math.max(Number(limit) || MAX_RESULTS, 1), MAX_RESULTS);
  const products = await electronicsProduct
    .find(filters.length ? { $and: filters } : {})
    .select("_id name price category model image stock")
    .sort({ createdAt: -1 })
    .limit(safeLimit)
    .lean();

  return products.map((product) => ({ ...product, id: product._id.toString(), _id: undefined }));
};

export const getProductById = async (productId) => {
  if (!mongoose.isValidObjectId(productId)) return null;
  const product = await electronicsProduct.findById(productId).select("_id name price category model image stock").lean();
  return product ? { ...product, id: product._id.toString(), _id: undefined } : null;
};
