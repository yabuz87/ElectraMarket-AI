import { create } from "zustand";

const resolveInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const storedTheme = window.localStorage.getItem("electra-theme");
  if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme) => {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.bsTheme = theme;
  document.documentElement.style.colorScheme = theme;
};

export const useThemeStore = create((set, get) => ({
  theme: resolveInitialTheme(),
  initializeTheme: () => applyTheme(get().theme),
  setTheme: (theme) => {
    if (theme !== "light" && theme !== "dark") return;
    window.localStorage.setItem("electra-theme", theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),
}));
