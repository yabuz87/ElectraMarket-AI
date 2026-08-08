import { create } from "zustand";
import { toast } from "react-toastify";
import { axiosInstance } from "../utils.js";

const readCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem("cart"));
    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
};

const saveCart = (cart) => localStorage.setItem("cart", JSON.stringify(cart));

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  cart: readCart(),

  addToCart: (product, quantity = 1) => {
    const safeQuantity = Math.max(Number.parseInt(quantity, 10) || 1, 1);
    const existing = get().cart.find((item) => item._id === product._id);
    const cart = existing
      ? get().cart.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + safeQuantity }
            : item
        )
      : [...get().cart, { ...product, quantity: safeQuantity }];

    saveCart(cart);
    set({ cart });
    toast.success("Added to cart", { toastId: `cart-added-${product._id}` });
  },

  removeFromCart: (productId) => {
    const cart = get().cart.filter((item) => item._id !== productId);
    saveCart(cart);
    set({ cart });
    toast.info("Removed from cart", { toastId: `cart-removed-${productId}` });
  },

  clearCart: () => {
    saveCart([]);
    set({ cart: [] });
  },

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/buyer/check");
      set({ authUser: response.data });
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const response = await axiosInstance.post("/buyer/signup", data);
      if (response.data.verificationRequired) {
        set({ authUser: null });
        toast.info("Check your email to verify your account", { toastId: "signup-verification" });
        return response.data;
      }
      set({ authUser: response.data });
      toast.success("Account created successfully", { toastId: "signup-success" });
      return response.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed", { toastId: "signup-error" });
      return null;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const response = await axiosInstance.post("/buyer/login", data);
      set({ authUser: response.data });
      toast.success("Logged in successfully", { toastId: "login-success" });
      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed", { toastId: "login-error" });
      return { success: false, code: error.response?.data?.code };
    } finally {
      set({ isLoggingIn: false });
    }
  },

  resendVerification: async (email) => {
    try {
      const response = await axiosInstance.post("/buyer/resend-verification", { email });
      toast.info(response.data.message, { toastId: "verification-resend" });
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not resend verification email", {
        toastId: "verification-resend-error",
      });
      return false;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/buyer/logout");
      set({ authUser: null });
      toast.success("Logged out successfully", { toastId: "logout-success" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed", { toastId: "logout-error" });
    }
  },
}));
