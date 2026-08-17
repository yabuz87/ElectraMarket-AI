"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

const FloatingChat = dynamic(() => import("../component/FloatingChat"), { ssr: false });

export default function AppProviders({ children }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeTheme();
    checkAuth();
  }, [checkAuth, initializeTheme]);

  return <>{children}<FloatingChat /><ToastContainer position="bottom-right" autoClose={3000} /></>;
}
