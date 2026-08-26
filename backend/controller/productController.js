import mongoose from "mongoose";
import electronicsProduct from "../model/electronics.product.js";
import { publishProductEvent, subscribeToProductEvents } from "../lib/productEvents.js";
import { getProductLikeState, toggleProductLikeState } from "../lib/productLikes.js";
import ProductVisit from "../model/productVisit.model.js";
import { rankRecommendations } from "../lib/recommendations.js";

const clampPagination = (pageValue, limitValue) => {
  const page = Math.max(Number.parseInt(pageValue, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(limitValue, 10) || 12, 1), 50);
  return { page, limit };
};

const buildProductQuery = ({ name, price, minPrice, maxPrice, category, model, q }) => {
  const query = {};
  const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (q) {
    const expression = { $regex: escapeRegex(q), $options: "i" };
    query.$or = [{ name: expression }, { model: expression }, { category: expression }];
  }
  if (name) query.name = { $regex: escapeRegex(name), $options: "i" };
  const minimum = Number(minPrice);
  const maximum = Number(maxPrice ?? price);
  if (Number.isFinite(minimum) || Number.isFinite(maximum)) {
    query.price = {};
    if (Number.isFinite(minimum)) query.price.$gte = Math.max(minimum, 0);
    if (Number.isFinite(maximum)) query.price.$lte = Math.max(maximum, 0);
  }
  if (category) query.category = { $regex: escapeRegex(category), $options: "i" };
  if (model) query.model = { $regex: escapeRegex(model), $options: "i" };

  return query;
};

const buildProductSort = (sort) => {
  const sortOptions = {
    newest: { createdAt: -1 },
    price_asc: { price: 1, _id: 1 },
    price_desc: { price: -1, _id: 1 },
    popular: { "likes.count": -1, createdAt: -1 },
    name_asc: { name: 1, _id: 1 },
  };

  return sortOptions[sort] || sortOptions.newest;
};

const findProducts = async (query, requestQuery) => {
  const sort = buildProductSort(requestQuery.sort);
  if (!requestQuery.page && !requestQuery.limit) {
    return electronicsProduct
      .find(query)
      .select("-likes.users -views.users")
      .populate("salerId", "fullName phone address rating profileImage")
      .sort(sort)
      .lean();
  }

  const { page, limit } = clampPagination(requestQuery.page, requestQuery.limit);
  const [products, total] = await Promise.all([
    electronicsProduct
      .find(query)
      .select("-likes.users -views.users")
      .populate("salerId", "fullName phone address rating profileImage")
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    electronicsProduct.countDocuments(query),
  ]);
  return { products, total, page, limit };
};

export const getAllProducts = async (req, res, next) => {
  try {
    const result = await findProducts({}, req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const searchProduct = async (req, res, next) => {
  try {
    const query = buildProductQuery(req.query);
    const result = await findProducts(query, req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

export const getProductCategories = async (_req, res, next) => {
  try {
    const values = await electronicsProduct.distinct("category", {
      category: { $type: "string", $ne: "" },
    });
    const categories = values
      .map((category) => category.trim())
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));

    return res.status(200).json({ categories });
  } catch (error) {
    return next(error);
  }
};

export const findOneProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await electronicsProduct
      .findById(id)
      .select("-likes.users -views.users")
      .populate("salerId", "fullName phone address rating profileImage")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
  } catch (error) {
    return next(error);
  }
};

export const trackProductView = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    const updated = await electronicsProduct.findByIdAndUpdate(
      id,
      { $inc: { "views.count": 1 } },
      { new: true, projection: { "views.count": 1 } }
    );
    if (!updated) return res.status(404).json({ message: "Product not found" });
    const count = Math.max(Number(updated.views?.count) || 0, 0);
    if (req.user?._id) {
      await ProductVisit.findOneAndUpdate(
        { buyerId: req.user._id, productId: updated._id },
        { $inc: { viewCount: 1 }, $set: { lastViewedAt: new Date() } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
    publishProductEvent(id, "view.updated", { count });
    return res.status(202).json({ count });
  } catch (error) {
    return next(error);
  }
};

export const getRecommendations = async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 8, 1), 12);
    res.setHeader("Cache-Control", "private, no-store");

    const [products, visits] = await Promise.all([
      electronicsProduct
        .find({})
        .select("-likes.users -views.users")
        .populate("salerId", "fullName phone address rating profileImage")
        .sort({ "views.count": -1, "likes.count": -1, createdAt: -1 })
        .limit(500)
        .lean(),
      req.user?._id
        ? ProductVisit.find({ buyerId: req.user._id })
            .sort({ lastViewedAt: -1 })
            .limit(50)
            .populate("productId", "name model category price spec")
            .lean()
        : Promise.resolve([]),
    ]);

    const recommendations = rankRecommendations(products, visits, { limit });
    return res.status(200).json({
      ...recommendations,
      reason: recommendations.strategy === "personalized"
        ? "Based on your recent product visits"
        : "Most viewed products across the marketplace",
    });
  } catch (error) {
    return next(error);
  }
};

export const getProductLikeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const state = await getProductLikeState(id, req.user._id);
    if (!state) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json({ liked: state.liked, count: state.count });
  } catch (error) {
    return next(error);
  }
};

export const toggleProductLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const state = await toggleProductLikeState(id, req.user._id);
    if (!state) return res.status(404).json({ message: "Product not found" });
    return res.status(200).json({ liked: state.liked, count: state.count });
  } catch (error) {
    return next(error);
  }
};

export const streamProductEvents = (req, res) => {
  const { productId } = req.params;
  if (!mongoose.isValidObjectId(productId)) {
    return res.status(400).json({ message: "Invalid product ID" });
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();
  res.write(`event: ready\ndata: ${JSON.stringify({ productId })}\n\n`);

  const unsubscribe = subscribeToProductEvents(productId, (event) => {
    res.write(`event: product-update\ndata: ${JSON.stringify({ type: event.type, productId: event.productId, data: event.data, timestamp: event.timestamp })}\n\n`);
    res.flush?.();
  });
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 25_000);
  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
};

export const filterProducts = async (req, res, next) => {
  try {
    const query = buildProductQuery(req.query);
    const result = await findProducts(query, req.query);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};
