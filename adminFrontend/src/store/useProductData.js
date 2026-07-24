import { create } from "zustand";
import { toast } from "react-toastify";
import { axiosInstance } from "../utils";

const asProductArray = (data) => (Array.isArray(data) ? data : data.products || []);

export const useProductData = create((set) => ({
  products: [],
  users: [],
  orders: [],
  isProductLoading: false,
  isUserLoading: false,
  isOrderLoading: false,
  isDeleting: false,
  isAddingProduct: false,

  fetchProductData: async () => {
    set({ isProductLoading: true });
    try {
      const response = await axiosInstance.get("/product/allProducts");
      set({ products: asProductArray(response.data) });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch products");
    } finally {
      set({ isProductLoading: false });
    }
  },

  getAllUsers: async () => {
    set({ isUserLoading: true });
    try {
      const response = await axiosInstance.get("/buyer/all");
      set({ users: response.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUserLoading: false });
    }
  },

  addProduct: async (data) => {
    set({ isAddingProduct: true });
    try {
      const response = await axiosInstance.post("/saler/addProduct", data);
      set((state) => ({
        products: [response.data.data, ...state.products],
      }));
      toast.success("Product added successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add product");
      return false;
    } finally {
      set({ isAddingProduct: false });
    }
  },

  editProduct: async (id, data) => {
    try {
      const response = await axiosInstance.put(`/saler/edit/${id}`, data);
      set((state) => ({
        products: state.products.map((product) =>
          product._id === id ? response.data.product : product
        ),
      }));
      toast.success("Product updated successfully");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update product");
      return false;
    }
  },

  deleteProduct: async (id) => {
    set({ isDeleting: true });
    try {
      await axiosInstance.delete(`/saler/deleteProduct/${id}`);
      set((state) => ({
        products: state.products.filter((product) => product._id !== id),
      }));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete product");
    } finally {
      set({ isDeleting: false });
    }
  },

  getOrders: async () => {
    set({ isOrderLoading: true });
    try {
      const response = await axiosInstance.get("/order/all");
      set({ orders: response.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch orders");
    } finally {
      set({ isOrderLoading: false });
    }
  },

  changeOrderStatus: async (orderId, status) => {
    try {
      const response = await axiosInstance.put("/order/status", { orderId, status });
      set((state) => ({
        orders: state.orders.map((order) =>
          order.orderId === orderId ? response.data.order : order
        ),
      }));
      toast.success("Order status updated");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update order");
    }
  },
}));
