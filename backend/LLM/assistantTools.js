import { getProductById, searchCatalog } from "./productTools.js";
import Order from "../model/order.model.js";

export const assistantTools = [
  {
    type: "function",
    function: {
      name: "getMyCart",
      description:
        "Inspect the signed-in customer's current browser cart, including item names, quantities, and total. Never request cart data from the customer manually.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyAccount",
      description:
        "Get a minimal overview of the currently signed-in buyer account. Never accept or request a user ID.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyOrders",
      description:
        "List recent orders belonging only to the currently signed-in buyer. Use for questions about whether the account has orders or recent order status.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["pending", "shipped", "delivered", "cancelled"],
          },
          limit: { type: "integer", minimum: 1, maximum: 10 },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getMyOrder",
      description:
        "Get one order by its public order number, scoped to the currently signed-in buyer.",
      parameters: {
        type: "object",
        properties: { orderId: { type: "string" } },
        required: ["orderId"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchProducts",
      description:
        "Search the live product catalog by keywords, category, model, and price. Use this before recommending or selecting products.",
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
      description: "Load one exact product from the live catalog by its product ID.",
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
      name: "addToCart",
      description:
        "Prepare adding an exact product to the browser cart after the user explicitly asks. Never invent a product ID.",
      parameters: {
        type: "object",
        properties: {
          productId: { type: "string" },
          quantity: { type: "integer", minimum: 1, maximum: 99 },
        },
        required: ["productId", "quantity"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "openProduct",
      description: "Open an exact product page after identifying the product.",
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
      name: "openCart",
      description: "Open the cart only when the user asks to see the cart.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "checkoutOrder",
      description:
        "Open checkout and optionally prefill shipping details only after the user explicitly asks to checkout.",
      parameters: {
        type: "object",
        properties: {
          shippingAddress: { type: "string", maxLength: 300 },
          shippingOption: {
            type: "string",
            enum: ["fast", "normal", "slow"],
          },
        },
        additionalProperties: false,
      },
    },
  },
];

const safeQuantity = (value) => Math.max(1, Math.min(Number(value) || 1, 99));

const authenticationRequired = () => ({
  result: {
    ok: false,
    code: "AUTHENTICATION_REQUIRED",
    error: "The customer must log in to use this feature",
  },
});

const orderDto = (order) => ({
  orderId: order.orderId,
  status: order.status,
  totalAmount: order.totalAmount,
  shippingFee: order.shippingFee,
  shippingOption: order.shippingOption,
  orderDate: order.orderDate,
  deliveryDate: order.deliveryDate,
  products: (order.products || []).map((item) => ({
    productId: String(item.productId?._id || item.productId),
    name: item.productId?.name || "Unavailable product",
    quantity: item.quantity,
    unitPrice: item.price,
  })),
});

export const executeAssistantTool = async (name, args = {}, context = {}) => {
  if (name === "getMyCart") {
    if (!context.user) return authenticationRequired();
    const items = Array.isArray(context.cart) ? context.cart : [];
    return {
      result: {
        ok: true,
        totalItems: items.reduce((total, item) => total + item.quantity, 0),
        totalAmount: items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        ),
        items,
      },
    };
  }

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

  if (name === "getMyOrders") {
    if (!context.user) return authenticationRequired();
    const validStatuses = ["pending", "shipped", "delivered", "cancelled"];
    const filter = { buyerId: context.user._id };
    if (validStatuses.includes(args.status)) filter.status = args.status;
    const limit = Math.min(Math.max(Number(args.limit) || 5, 1), 10);
    const orders = await Order.find(filter)
      .sort({ orderDate: -1 })
      .limit(limit)
      .populate("products.productId", "name")
      .lean();
    return {
      result: {
        ok: true,
        totalReturned: orders.length,
        orders: orders.map(orderDto),
      },
    };
  }

  if (name === "getMyOrder") {
    if (!context.user) return authenticationRequired();
    const order = await Order.findOne({
      orderId: String(args.orderId || "").trim(),
      buyerId: context.user._id,
    })
      .populate("products.productId", "name")
      .lean();
    return {
      result: order
        ? { ok: true, order: orderDto(order) }
        : { ok: false, error: "Order not found on this account" },
    };
  }

  if (name === "searchProducts") {
    const products = await searchCatalog(args);
    return {
      result: { ok: true, total: products.length, products },
      products,
    };
  }

  if (name === "getProductDetails") {
    const product = await getProductById(args.productId);
    return { result: product ? { ok: true, product } : { ok: false, error: "Product not found" } };
  }

  if (name === "addToCart") {
    if (!context.user) return authenticationRequired();
    const product = await getProductById(args.productId);
    if (!product) return { result: { ok: false, error: "Product not found" } };
    const quantity = safeQuantity(args.quantity);
    return {
      result: { ok: true, product, quantity },
      action: { type: "addToCart", productId: product.id, quantity },
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

  if (name === "openCart") {
    if (!context.user) return authenticationRequired();
    return { result: { ok: true }, action: { type: "openCart" } };
  }

  if (name === "checkoutOrder") {
    if (!context.user) return authenticationRequired();
    const shippingOption = ["fast", "normal", "slow"].includes(args.shippingOption)
      ? args.shippingOption
      : "normal";
    return {
      result: { ok: true, shippingOption },
      action: {
        type: "checkoutOrder",
        shippingAddress: String(args.shippingAddress || "").slice(0, 300),
        shippingOption,
      },
    };
  }

  return { result: { ok: false, error: "Unsupported tool" } };
};
