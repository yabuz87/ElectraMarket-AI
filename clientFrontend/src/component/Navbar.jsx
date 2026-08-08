import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export default function ClientNavbar() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const authUser = useAuthStore((state) => state.authUser);
  const cartCount = useAuthStore((state) =>
    state.cart.reduce((total, item) => total + (item.quantity || 1), 0)
  );

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold text-primary" to="/">
          ElectraStore
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="navbarNav"
          aria-expanded={!isCollapsed}
          aria-label="Toggle navigation"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`${isCollapsed ? "collapse" : ""} navbar-collapse`} id="navbarNav">
          <ul className="navbar-nav ms-auto fw-semibold">
            <li className="nav-item">
              <NavLink className="nav-link" to="/">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/about">
                About
              </NavLink>
            </li>
            {authUser && (
              <li className="nav-item">
                <NavLink className="nav-link" to="/orders">
                  My orders
                </NavLink>
              </li>
            )}
            <li className="nav-item">
              <NavLink className="nav-link" to={authUser ? "/logout" : "/login"}>
                {authUser ? "Logout" : "Login"}
              </NavLink>
            </li>
          </ul>
          <Link
            to="/cart"
            className="btn btn-primary ms-lg-3 mt-3 mt-lg-0 px-4 fw-bold d-inline-flex align-items-center gap-2"
          >
            <ShoppingCart aria-hidden="true" size={18} /> Cart ({cartCount})
          </Link>
        </div>
      </div>
    </nav>
  );
}
