import bcrypt from "bcrypt";
import mongoose from "mongoose";
import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/util.js";
import electronicsProduct from "../model/electronics.product.js";
import ProductComment from "../model/productComment.model.js";
import Saler from "../model/saler.user.js";
import {
  deleteProductKnowledge,
  syncProductKnowledge,
} from "../LLM/ragService.js";

const scheduleKnowledgeUpdate = (operation, label) => {
  if (!process.env.OPENROUTER_API_KEY?.trim()) return;
  void operation().catch((error) =>
    console.error(`Product knowledge ${label} failed:`, error.message)
  );
};

const publicSeller = (seller) => ({
  _id: seller._id,
  fullName: seller.fullName,
  email: seller.email,
  phone: seller.phone,
  address: seller.address,
  rating: seller.rating,
});

export const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, phone, address } = req.body;
    if (!fullName || !email || !password || !phone || !address) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existing = await Saler.findOne({ $or: [{ email }, { phone }] }).lean();
    if (existing) {
      return res.status(409).json({
        message:
          existing.email === email
            ? "Email is already registered"
            : "Phone number is already registered",
      });
    }

    const newSeller = await Saler.create({
      fullName,
      email,
      password: await bcrypt.hash(password, 10),
      phone,
      address,
    });

    generateToken(newSeller._id, "seller", res);
    return res.status(201).json(publicSeller(newSeller));
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const seller = await Saler.findOne({ email });
    if (!seller || !(await bcrypt.compare(password, seller.password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    generateToken(seller._id, "seller", res);
    return res.status(200).json(publicSeller(seller));
  } catch (error) {
    return next(error);
  }
};

export const logout = (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  };
  res.clearCookie("sellerJwt", cookieOptions);
  res.clearCookie("jwt", cookieOptions);
  return res.status(200).json({ message: "Logged out successfully" });
};

export const check = (req, res) => res.status(200).json(req.user);

export const updateProfile = async (req, res, next) => {
  try {
    const fullName = String(req.body?.fullName || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const address = String(req.body?.address || "").trim();
    if (!fullName || !phone || !address) {
      return res.status(400).json({ message: "Name, phone number, and address are required" });
    }

    const phoneOwner = await Saler.exists({
      phone,
      _id: { $ne: req.user._id },
    });
    if (phoneOwner) {
      return res.status(409).json({ message: "Phone number is already registered" });
    }

    const seller = await Saler.findByIdAndUpdate(
      req.user._id,
      { fullName, phone, address },
      { new: true, runValidators: true }
    );
    return res.status(200).json(publicSeller(seller));
  } catch (error) {
    return next(error);
  }
};

export const getOwnProducts = async (req, res, next) => {
  try {
    const products = await electronicsProduct
      .find({ salerId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    const productIds = products.map((product) => product._id);
    const commentCounts = await ProductComment.aggregate([
      { $match: { productId: { $in: productIds } } },
      { $group: { _id: "$productId", count: { $sum: 1 } } },
    ]);
    const commentsByProduct = new Map(
      commentCounts.map((entry) => [String(entry._id), entry.count])
    );

    return res.status(200).json(
      products.map((product) => ({
        ...product,
        commentCount: commentsByProduct.get(String(product._id)) || 0,
      }))
    );
  } catch (error) {
    return next(error);
  }
};

export const addProduct = async (req, res, next) => {
  try {
    const { name, model, price, image, category, spec, productDate } =
      req.body;

    if (!name || !model || price === undefined || !category) {
      return res.status(400).json({ message: "Missing required product fields" });
    }
    if (!req.user.fullName || !req.user.phone || !req.user.address) {
      return res.status(409).json({
        message: "Complete your public owner profile before publishing a listing",
      });
    }
    if (spec && typeof spec !== "object") {
      return res.status(400).json({ message: "Specifications must be an object" });
    }
    if (!Array.isArray(image) || image.length === 0) {
      return res.status(400).json({ message: "At least one image is required" });
    }

    const uploads = await Promise.all(
      image.map((file) =>
        cloudinary.uploader.upload(file, { folder: "product_images" })
      )
    );
    const photos = uploads.map((upload) => ({
      url: upload.secure_url,
      publicId: upload.public_id,
    }));

    const newProduct = await electronicsProduct.create({
      name,
      model,
      price: Number(price),
      image: photos,
      category,
      spec,
      productDate,
      salerId: req.user._id,
    });
    scheduleKnowledgeUpdate(() => syncProductKnowledge(newProduct), "sync");

    return res
      .status(201)
      .json({ message: "Product saved successfully", data: newProduct });
  } catch (error) {
    return next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const product = await electronicsProduct.findOne({
      _id: req.params.id,
      salerId: req.user._id,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    await Promise.all(
      (product.image || [])
        .filter((image) => image.publicId)
        .map((image) => cloudinary.uploader.destroy(image.publicId))
    );
    await product.deleteOne();
    scheduleKnowledgeUpdate(() => deleteProductKnowledge(product._id), "delete");

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    return next(error);
  }
};

export const editProduct = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const allowedFields = [
      "name",
      "model",
      "price",
      "category",
      "spec",
      "productDate",
    ];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([key]) => allowedFields.includes(key))
    );
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid product fields supplied" });
    }

    const product = await electronicsProduct.findOneAndUpdate(
      {
        _id: req.params.id,
        salerId: req.user._id,
      },
      updates,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    scheduleKnowledgeUpdate(() => syncProductKnowledge(product), "sync");

    return res.status(200).json({ message: "Product updated successfully", product });
  } catch (error) {
    return next(error);
  }
};
