import mongoose from "mongoose";
import electronicsProduct from "../model/electronics.product.js";
import ProductComment from "../model/productComment.model.js";

const pagination = (pageValue, limitValue) => ({
  page: Math.max(Number.parseInt(pageValue, 10) || 1, 1),
  limit: Math.min(Math.max(Number.parseInt(limitValue, 10) || 5, 1), 20),
});

const commentDto = (comment) => ({
  _id: String(comment._id),
  content: comment.content,
  author: {
    _id: String(comment.authorId?._id || comment.authorId),
    fullName: comment.authorId?.fullName || "ElectraStore customer",
  },
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

export const getProductComments = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const { page, limit } = pagination(req.query.page, req.query.limit);
    const filter = { productId: req.params.productId };
    const [comments, total] = await Promise.all([
      ProductComment.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("authorId", "fullName")
        .lean(),
      ProductComment.countDocuments(filter),
    ]);

    return res.status(200).json({
      comments: comments.map(commentDto),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return next(error);
  }
};

export const createProductComment = async (req, res, next) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const content = typeof req.body?.content === "string" ? req.body.content.trim() : "";
    if (content.length < 2 || content.length > 1000) {
      return res.status(400).json({ message: "Comment must be between 2 and 1000 characters" });
    }

    const productExists = await electronicsProduct.exists({ _id: productId });
    if (!productExists) return res.status(404).json({ message: "Product not found" });

    const created = await ProductComment.create({
      productId,
      authorId: req.user._id,
      content,
    });
    const comment = await ProductComment.findById(created._id)
      .populate("authorId", "fullName")
      .lean();

    return res.status(201).json({ comment: commentDto(comment) });
  } catch (error) {
    return next(error);
  }
};

export const deleteProductComment = async (req, res, next) => {
  try {
    const { productId, commentId } = req.params;
    if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({ message: "Invalid comment request" });
    }

    const deleted = await ProductComment.findOneAndDelete({
      _id: commentId,
      productId,
      authorId: req.user._id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Comment not found or you cannot delete it" });
    }

    return res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    return next(error);
  }
};
