import Order from "../model/order.model.js";
import electronicsProduct from "../model/electronics.product.js";
import { v4 as uuidv4 } from "uuid";

const shippingOptions = {
  fast: { days: 5, feePerItem: 100 },
  normal: { days: 7, feePerItem: 50 },
  slow: { days: 30, feePerItem: 10 },
};
const statusTransitions = {
  pending: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const sellerOrderView = (order, sellerId, ownedProductIds) => {
  const { sellerStatuses = [], ...orderData } = order;
  const products = (order.products || []).filter((product) =>
    ownedProductIds.has(String(product.productId))
  );
  const itemCount = products.reduce((total, product) => total + product.quantity, 0);
  const itemsTotal = products.reduce(
    (total, product) => total + product.price * product.quantity,
    0
  );
  const sellerShippingFee = (shippingOptions[order.shippingOption]?.feePerItem || 0) * itemCount;
  const sellerStatus = sellerStatuses.find(
    (entry) => String(entry.sellerId) === String(sellerId)
  );

  return {
    ...orderData,
    products,
    status: sellerStatus?.status || order.status,
    shippingFee: sellerShippingFee,
    totalAmount: itemsTotal + sellerShippingFee,
  };
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
    const ownedProductIds = await electronicsProduct.distinct("_id", {
      salerId: req.user._id,
    });
    if (!ownedProductIds.length) return res.status(200).json([]);

    const ownedSet = new Set(ownedProductIds.map(String));
    const orders = await Order.find({
      "products.productId": { $in: ownedProductIds },
    })
      .sort({ orderDate: -1 })
      .lean();

    return res
      .status(200)
      .json(orders.map((order) => sellerOrderView(order, req.user._id, ownedSet)));
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
      .select("_id price salerId")
      .lean();
    if (
      catalogProducts.length !== new Set(productIds.map(String)).size ||
      catalogProducts.some((product) => !product.salerId)
    ) {
      return res.status(400).json({ message: "One or more products are unavailable" });
    }

    const priceById = new Map(
      catalogProducts.map((product) => [String(product._id), product.price])
    );
    const sellerIds = [
      ...new Set(catalogProducts.map((product) => String(product.salerId))),
    ];
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
      sellerStatuses: sellerIds.map((sellerId) => ({ sellerId, status: "pending" })),
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

    const ownedProductIds = await electronicsProduct.distinct("_id", {
      salerId: req.user._id,
    });
    const order = await Order.findOne({
      orderId,
      "products.productId": { $in: ownedProductIds },
    });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const sellerStatus = order.sellerStatuses.find(
      (entry) => String(entry.sellerId) === String(req.user._id)
    );
    const currentStatus = sellerStatus?.status || order.status;
    if (status !== currentStatus && !statusTransitions[currentStatus]?.includes(status)) {
      return res.status(409).json({
        message: `Order status cannot change from ${currentStatus} to ${status}`,
      });
    }
    if (sellerStatus) sellerStatus.status = status;
    else order.sellerStatuses.push({ sellerId: req.user._id, status });

    const allProductIds = order.products.map((product) => product.productId);
    const allSellerIds = await electronicsProduct.distinct("salerId", {
      _id: { $in: allProductIds },
    });
    const statuses = order.sellerStatuses.filter((entry) =>
      allSellerIds.some((sellerId) => String(sellerId) === String(entry.sellerId))
    );
    if (statuses.length >= allSellerIds.length) {
      if (statuses.every((entry) => entry.status === "delivered")) order.status = "delivered";
      else if (statuses.every((entry) => entry.status === "cancelled")) order.status = "cancelled";
      else if (statuses.some((entry) => ["shipped", "delivered"].includes(entry.status))) order.status = "shipped";
      else order.status = "pending";
    }

    await order.save();
    const ownedSet = new Set(ownedProductIds.map(String));
    const sellerOrder = sellerOrderView(order.toObject(), req.user._id, ownedSet);

    return res
      .status(200)
      .json({ message: "Order status updated successfully", order: sellerOrder });
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
    order.sellerStatuses.forEach((entry) => {
      entry.status = "cancelled";
    });
    await order.save();
    return res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    return next(error);
  }
};
