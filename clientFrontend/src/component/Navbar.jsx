"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Info, LayoutGrid, LogIn, LogOut, Menu, Moon, Sun, X, Zap } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

export default function ClientNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const authUser = useAuthStore((state) => state.authUser);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const closeMenu = () => setIsOpen(false);
  const pathname = usePathname();

  return (
    <>
      <div className="announcement-bar">Discover local products <span>•</span> Contact owners directly <span>•</span> No platform transaction fees</div>
      <nav className="store-navbar sticky-top" aria-label="Main navigation">
        <div className="container store-navbar__inner">
          <Link className="brand" href="/" onClick={closeMenu}><span><Zap size={21} fill="currentColor" /></span>ElectraMarket</Link>
          <button className="mobile-menu-button" aria-expanded={isOpen} aria-controls="main-menu" aria-label="Toggle navigation" onClick={() => setIsOpen((open) => !open)}>{isOpen ? <X /> : <Menu />}</button>
          <div id="main-menu" className={`store-nav-menu ${isOpen ? "store-nav-menu--open" : ""}`}>
            <div className="store-nav-links">
              <Link className={pathname === "/" ? "active" : ""} href="/" onClick={closeMenu}><LayoutGrid size={16} /> Browse</Link>
              <Link className={pathname === "/about" ? "active" : ""} href="/about" onClick={closeMenu}><Info size={16} /> About</Link>
            </div>
            <div className="store-nav-actions">
              <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}</button>
              <Link className={`account-link ${pathname === "/login" ? "active" : ""}`} href={authUser ? "/logout" : "/login"} onClick={closeMenu}>{authUser ? <><LogOut size={17} /> Logout</> : <><LogIn size={17} /> Login</>}</Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
