import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Info, LogIn, LogOut, Menu, Moon, Package, ShoppingBag, Sun, X, Zap } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";

export default function ClientNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const authUser = useAuthStore((state) => state.authUser);
  const cartCount = useAuthStore((state) => state.cart.reduce((total, item) => total + (item.quantity || 1), 0));
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <div className="announcement-bar">AI-assisted shopping <span>•</span> Secure account checkout <span>•</span> Shop confidently</div>
      <nav className="store-navbar sticky-top" aria-label="Main navigation">
        <div className="container store-navbar__inner">
          <Link className="brand" to="/" onClick={closeMenu}><span><Zap size={21} fill="currentColor" /></span>ElectraStore</Link>
          <button className="mobile-menu-button" aria-expanded={isOpen} aria-controls="main-menu" aria-label="Toggle navigation" onClick={() => setIsOpen((open) => !open)}>
            {isOpen ? <X /> : <Menu />}
          </button>
          <div id="main-menu" className={`store-nav-menu ${isOpen ? "store-nav-menu--open" : ""}`}>
            <div className="store-nav-links">
              <NavLink to="/" onClick={closeMenu}>Shop</NavLink>
              <NavLink to="/about" onClick={closeMenu}><Info size={16} /> About</NavLink>
              {authUser && <NavLink to="/orders" onClick={closeMenu}><Package size={16} /> Orders</NavLink>}
            </div>
            <div className="store-nav-actions">
              <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
                {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
              </button>
              <NavLink className="account-link" to={authUser ? "/logout" : "/login"} onClick={closeMenu}>
                {authUser ? <><LogOut size={17} /> Logout</> : <><LogIn size={17} /> Login</>}
              </NavLink>
              <Link to="/cart" className="cart-button" onClick={closeMenu}><ShoppingBag size={19} /> Cart {cartCount > 0 && <span>{cartCount > 99 ? "99+" : cartCount}</span>}</Link>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
