import mongoose from "mongoose";
import electronicsProduct from "../model/electronics.product.js";

const clampPagination = (pageValue, limitValue) => {
  const page = Math.max(Number.parseInt(pageValue, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(limitValue, 10) || 12, 1), 50);
  return { page, limit };
};

const buildProductQuery = ({ name, price, category, model, q }) => {
  const query = {};
  const escapeRegex = (value) =>
    String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  if (q) {
    const expression = { $regex: escapeRegex(q), $options: "i" };
    query.$or = [{ name: expression }, { model: expression }, { category: expression }];
  }
  if (name) query.name = { $regex: escapeRegex(name), $options: "i" };
  if (price) query.price = { $lte: Number(price) };
  if (category) query.category = { $regex: escapeRegex(category), $options: "i" };
  if (model) query.model = { $regex: escapeRegex(model), $options: "i" };

  return query;
};

const findProducts = async (query, requestQuery) => {
  if (!requestQuery.page && !requestQuery.limit) {
    return electronicsProduct
      .find(query)
      .select("-likes.users -views.users")
      .sort({ createdAt: -1 })
      .lean();
  }

  const { page, limit } = clampPagination(requestQuery.page, requestQuery.limit);
  const [products, total] = await Promise.all([
    electronicsProduct
      .find(query)
      .select("-likes.users -views.users")
      .sort({ createdAt: -1 })
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

export const findOneProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await electronicsProduct
      .findByIdAndUpdate(id, { $inc: { "views.count": 1 } }, { new: true })
      .select("-likes.users -views.users")
      .populate("salerId", "fullName rating profileImage")
      .lean();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.status(200).json(product);
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

    const product = await electronicsProduct.findById(id).select("likes").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    return res.status(200).json({
      liked: product.likes?.users?.some(
        (userId) => String(userId) === String(req.user._id)
      ) || false,
      count: product.likes?.count || 0,
    });
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

    const product = await electronicsProduct.findById(id).select("likes").lean();
    if (!product) return res.status(404).json({ message: "Product not found" });

    const userId = req.user._id;
    const wasLiked = product.likes?.users?.some(
      (likedUserId) => String(likedUserId) === String(userId)
    );
    const condition = wasLiked
      ? { _id: id, "likes.users": userId }
      : { _id: id, "likes.users": { $ne: userId } };
    const update = wasLiked
      ? { $pull: { "likes.users": userId }, $inc: { "likes.count": -1 } }
      : { $addToSet: { "likes.users": userId }, $inc: { "likes.count": 1 } };

    let updated = await electronicsProduct
      .findOneAndUpdate(condition, update, { new: true })
      .select("likes")
      .lean();

    // A concurrent request may have already performed the same toggle.
    if (!updated) {
      updated = await electronicsProduct.findById(id).select("likes").lean();
    }

    return res.status(200).json({
      liked: updated.likes?.users?.some(
        (likedUserId) => String(likedUserId) === String(userId)
      ) || false,
      count: Math.max(updated.likes?.count || 0, 0),
    });
  } catch (error) {
    return next(error);
  }
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
