import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Info, LayoutGrid, LogIn, LogOut, Menu, Moon, Sun, X, Zap } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

export default function ClientNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const authUser = useAuthStore((state) => state.authUser);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <div className="announcement-bar">Discover local products <span>•</span> Contact owners directly <span>•</span> No platform transaction fees</div>
      <nav className="store-navbar sticky-top" aria-label="Main navigation">
        <div className="container store-navbar__inner">
          <Link className="brand" to="/" onClick={closeMenu}><span><Zap size={21} fill="currentColor" /></span>ElectraStore</Link>
          <button className="mobile-menu-button" aria-expanded={isOpen} aria-controls="main-menu" aria-label="Toggle navigation" onClick={() => setIsOpen((open) => !open)}>{isOpen ? <X /> : <Menu />}</button>
          <div id="main-menu" className={`store-nav-menu ${isOpen ? "store-nav-menu--open" : ""}`}>
            <div className="store-nav-links">
              <NavLink to="/" onClick={closeMenu}><LayoutGrid size={16} /> Browse</NavLink>
              <NavLink to="/about" onClick={closeMenu}><Info size={16} /> About</NavLink>
            </div>
            <div className="store-nav-actions">
              <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}</button>
              <NavLink className="account-link" to={authUser ? "/logout" : "/login"} onClick={closeMenu}>{authUser ? <><LogOut size={17} /> Logout</> : <><LogIn size={17} /> Login</>}</NavLink>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
