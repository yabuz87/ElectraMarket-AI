import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import Spinner from "./Spinner";
import { Moon, Store, Sun } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import "./AdminLogin.css";

export default function AdminLogin() {
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login(email.trim(), password);
  };

  return (
    <main className="login-page">
      <button className="login-theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <div className="login-card">
        <div className="login-brand"><span><Store size={23} /></span><div><strong>Electra</strong><small>Seller workspace</small></div></div>
        <div className="login-heading"><span>Welcome back</span><h1>Sign in to manage your listings</h1><p>Track engagement and keep your public product catalog up to date.</p></div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email address
            </label>
            <input
              id="email"
              type="email"
              className="form-control form-control-lg"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus
              autoComplete="username"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-control form-control-lg"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-brand w-100 btn-lg"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? <Spinner /> : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
