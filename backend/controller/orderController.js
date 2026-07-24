import Order from "../model/order.model.js";
import electronicsProduct from "../model/electronics.product.js";
import { v4 as uuidv4 } from "uuid";

const shippingOptions = {
  fast: { days: 5, feePerItem: 100 },
  normal: { days: 7, feePerItem: 50 },
  slow: { days: 30, feePerItem: 10 },
};

export const getOrderDetails = async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id) {
      return res.status(403).json({ message: "You can only view your own orders" });
    }

    const orders = await Order.find({ buyerId: req.user._id })
      .sort({ orderDate: -1 })
      .lean();
    return res.status(200).json(orders);
  } catch (error) {
    return next(error);
  }
};

export const getAllOrder = async (req, res, next) => {
  try {
    const orders = await Order.find({}).sort({ orderDate: -1 }).lean();
    return res.status(200).json(orders);
  } catch (error) {
    return next(error);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, products, shippingOption = "normal" } = req.body;
    if (!shippingAddress || !Array.isArray(products) || products.length === 0) {
      return res
        .status(400)
        .json({ message: "Shipping address and products are required" });
    }

    const option = shippingOptions[shippingOption];
    if (!option) {
      return res.status(400).json({ message: "Invalid shipping option" });
    }

    const productIds = products.map((product) => product.productId);
    const catalogProducts = await electronicsProduct
      .find({ _id: { $in: productIds } })
      .select("_id price")
      .lean();
    if (catalogProducts.length !== new Set(productIds.map(String)).size) {
      return res.status(400).json({ message: "One or more products are unavailable" });
    }

    const priceById = new Map(
      catalogProducts.map((product) => [String(product._id), product.price])
    );
    const orderProducts = products.map((product) => ({
      productId: product.productId,
      quantity: Math.max(Number.parseInt(product.quantity, 10) || 1, 1),
      price: priceById.get(String(product.productId)),
    }));
    const itemCount = orderProducts.reduce(
      (total, product) => total + product.quantity,
      0
    );
    const productsTotal = orderProducts.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );
    const shippingFee = option.feePerItem * itemCount;

    const order = await Order.create({
      orderId: uuidv4(),
      buyerId: req.user._id,
      shippingAddress,
      products: orderProducts,
      totalAmount: productsTotal + shippingFee,
      shippingFee,
      shippingOption,
      deliveryDate: new Date(Date.now() + option.days * 24 * 60 * 60 * 1000),
    });

    return res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    return next(error);
  }
};

export const changeOrderStatus = async (req, res, next) => {
  try {
    const { orderId, status } = req.body;
    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    if (!orderId || !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Valid order ID and status are required" });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { status },
      { new: true, runValidators: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res
      .status(200)
      .json({ message: "Order status updated successfully", order: updatedOrder });
  } catch (error) {
    return next(error);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.id,
      buyerId: req.user._id,
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.status !== "pending") {
      return res
        .status(400)
        .json({ message: `A ${order.status} order cannot be cancelled` });
    }

    order.status = "cancelled";
    await order.save();
    return res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    return next(error);
  }
};
