import { create } from "zustand";
import { toast } from "react-toastify";
import { axiosInstance } from "../utils.js";

const productPayload = (data) =>
  Array.isArray(data)
    ? { products: data, total: data.length }
    : { products: data.products || [], total: data.total || 0 };

export const useProductData = create((set) => ({
  products: [],
  totalProducts: 0,
  orderHistory: [],
  singleProduct: null,
  isProductLoading: false,
  isSearching: false,
  isOrderLoading: false,
  isOrderCreating: false,
  isLikeUpdating: false,

  fetchProductData: async (page, limit) => {
    set({ isProductLoading: true });
    try {
      const params = page && limit ? { page, limit } : undefined;
      const response = await axiosInstance.get("/product/allProducts", { params });
      const payload = productPayload(response.data);
      set({ ...payload });
      return payload.products;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products", { toastId: "products-fetch-error" });
      return [];
    } finally {
      set({ isProductLoading: false });
    }
  },

  fetchProductById: async (productId) => {
    set({ isProductLoading: true });
    try {
      const response = await axiosInstance.get(`/product/findOneProduct/${productId}`);
      set({ singleProduct: response.data });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch product", { toastId: "product-fetch-error" });
      return null;
    } finally {
      set({ isProductLoading: false });
    }
  },

  fetchLikeStatus: async (productId) => {
    try {
      const response = await axiosInstance.get(`/product/like/${productId}`);
      set((state) => ({
        singleProduct:
          state.singleProduct?._id === productId
            ? {
                ...state.singleProduct,
                likedByUser: response.data.liked,
                likes: {
                  ...state.singleProduct.likes,
                  count: response.data.count,
                },
              }
            : state.singleProduct,
      }));
      return response.data;
    } catch (error) {
      if (error.response?.status !== 401) {
        toast.error(error.response?.data?.message || "Failed to fetch like status", {
          toastId: "like-status-error",
        });
      }
      return null;
    }
  },

  toggleProductLike: async (productId) => {
    set({ isLikeUpdating: true });
    try {
      const response = await axiosInstance.put(`/product/like/${productId}`);
      const { liked, count } = response.data;
      set((state) => ({
        singleProduct:
          state.singleProduct?._id === productId
            ? {
                ...state.singleProduct,
                likedByUser: liked,
                likes: { ...state.singleProduct.likes, count },
              }
            : state.singleProduct,
        products: state.products.map((product) =>
          product._id === productId
            ? { ...product, likes: { ...product.likes, count } }
            : product
        ),
      }));
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update like", {
        toastId: "like-update-error",
      });
      return null;
    } finally {
      set({ isLikeUpdating: false });
    }
  },

  search: async ({ searchType, value, page, limit }) => {
    set({ isSearching: true });
    try {
      const params = { page, limit };
      if (searchType === "price") params.price = value;
      else params.q = value;
      const response = await axiosInstance.get("/product/searchProduct", { params });
      const payload = productPayload(response.data);
      set({ ...payload });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to search products", { toastId: "products-search-error" });
    } finally {
      set({ isSearching: false });
    }
  },

  fetchOrderHistory: async (userId) => {
    set({ isOrderLoading: true });
    try {
      const response = await axiosInstance.get(`/order/${userId}`);
      set({ orderHistory: response.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch order history", { toastId: "orders-fetch-error" });
    } finally {
      set({ isOrderLoading: false });
    }
  },

  createOrder: async (orderData) => {
    set({ isOrderCreating: true });
    try {
      const response = await axiosInstance.post("/order/create", orderData);
      set((state) => ({
        orderHistory: [response.data.order, ...state.orderHistory],
      }));
      toast.success("Order created successfully", { toastId: `order-success-${response.data.order._id}` });
      return response.data.order;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create order", { toastId: "order-create-error" });
      return null;
    } finally {
      set({ isOrderCreating: false });
    }
  },

  assistant: async (userPrompt, history = []) => {
    const response = await axiosInstance.post("/assistant/chat", {
      userPrompt,
      history,
    });
    return response.data;
  },
}));
