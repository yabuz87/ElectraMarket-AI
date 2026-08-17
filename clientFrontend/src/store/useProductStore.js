import { create } from "zustand";
import { toast } from "react-toastify";
import { axiosInstance } from "../utils.js";

const productPayload = (data) =>
  Array.isArray(data)
    ? { products: data, totalProducts: data.length }
    : { products: data.products || [], totalProducts: data.total || 0 };

export const useProductData = create((set) => ({
  products: [],
  totalProducts: 0,
  categories: [],
  comments: [],
  totalComments: 0,
  commentPage: 1,
  totalCommentPages: 0,
  singleProduct: null,
  isProductLoading: false,
  isSearching: false,
  isLikeUpdating: false,
  isCommentLoading: false,
  isCommentPosting: false,

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

  fetchCategories: async () => {
    try {
      const response = await axiosInstance.get("/product/categories");
      const categories = response.data?.categories || [];
      set({ categories });
      return categories;
    } catch (_error) {
      return [];
    }
  },

  fetchFilteredProducts: async (filters = {}) => {
    set({ isSearching: true });
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(
          ([, value]) => value !== "" && value !== undefined && value !== null
        )
      );
      const response = await axiosInstance.get("/product/filterProducts", { params });
      const payload = productPayload(response.data);
      set({ ...payload });
      return payload.products;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to filter products", {
        toastId: "products-filter-error",
      });
      return [];
    } finally {
      set({ isSearching: false });
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

  trackProductView: async (productId) => {
    try {
      await axiosInstance.post(`/product/view/${productId}`);
    } catch {
      // View tracking must never block product discovery.
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

  applyAssistantLike: ({ productId, liked, count }) => {
    set((state) => ({
      singleProduct:
        state.singleProduct?._id === productId
          ? {
              ...state.singleProduct,
              likedByUser: Boolean(liked),
              likes: { ...state.singleProduct.likes, count: Math.max(Number(count) || 0, 0) },
            }
          : state.singleProduct,
      products: state.products.map((product) =>
        product._id === productId
          ? {
              ...product,
              likedByUser: Boolean(liked),
              likes: { ...product.likes, count: Math.max(Number(count) || 0, 0) },
            }
          : product
      ),
    }));
  },

  applyRealtimeLike: ({ productId, count }) => {
    set((state) => ({
      singleProduct:
        state.singleProduct?._id === productId
          ? { ...state.singleProduct, likes: { ...state.singleProduct.likes, count: Math.max(Number(count) || 0, 0) } }
          : state.singleProduct,
      products: state.products.map((product) =>
        product._id === productId
          ? { ...product, likes: { ...product.likes, count: Math.max(Number(count) || 0, 0) } }
          : product
      ),
    }));
  },

  fetchProductComments: async (productId, page = 1, limit = 5) => {
    set({ isCommentLoading: true });
    try {
      const response = await axiosInstance.get(`/product/comments/${productId}`, {
        params: { page, limit },
      });
      set({
        comments: response.data.comments || [],
        totalComments: response.data.total || 0,
        commentPage: response.data.page || page,
        totalCommentPages: response.data.totalPages || 0,
      });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load comments", {
        toastId: "comments-fetch-error",
      });
      return null;
    } finally {
      set({ isCommentLoading: false });
    }
  },

  createProductComment: async (productId, content) => {
    set({ isCommentPosting: true });
    try {
      const response = await axiosInstance.post(`/product/comments/${productId}`, {
        content,
      });
      toast.success("Comment posted", { toastId: "comment-created" });
      return response.data.comment;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to post comment", {
        toastId: "comment-create-error",
      });
      return null;
    } finally {
      set({ isCommentPosting: false });
    }
  },

  deleteProductComment: async (productId, commentId) => {
    try {
      await axiosInstance.delete(`/product/comments/${productId}/${commentId}`);
      toast.info("Comment deleted", { toastId: `comment-deleted-${commentId}` });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete comment", {
        toastId: "comment-delete-error",
      });
      return false;
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

  assistant: async (userPrompt, history = [], clientContext = {}) => {
    const response = await axiosInstance.post(
      "/assistant/chat",
      { userPrompt, history, clientContext },
      { timeout: 65_000 }
    );
    return response.data;
  },
}));
