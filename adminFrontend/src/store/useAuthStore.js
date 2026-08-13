import { create } from "zustand";
import { toast } from "react-toastify";
import { axiosInstance } from "../utils";

export const useAuthStore = create((set) => ({
  admin: null,
  isCheckingAuth: true,
  isLoggingIn: false,
  isLoggingOut: false,
  isUpdatingProfile: false,

  checkAuth: async () => {
    try {
      const response = await axiosInstance.get("/saler/check");
      set({ admin: response.data });
    } catch {
      set({ admin: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  login: async (email, password) => {
    set({ isLoggingIn: true });
    try {
      const response = await axiosInstance.post("/saler/login", {
        email,
        password,
      });
      set({ admin: response.data });
      toast.success("Welcome back");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    set({ isLoggingOut: true });
    try {
      await axiosInstance.post("/saler/logout");
      set({ admin: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    } finally {
      set({ isLoggingOut: false });
    }
  },

  updateProfile: async (profile) => {
    set({ isUpdatingProfile: true });
    try {
      const response = await axiosInstance.put("/saler/profile", profile);
      set({ admin: response.data });
      toast.success("Public profile updated");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed");
      return false;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },
}));
