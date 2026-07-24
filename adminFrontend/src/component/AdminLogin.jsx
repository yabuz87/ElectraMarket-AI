import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import Spinner from "./Spinner";
import "./AdminLogin.css";

export default function AdminLogin() {
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login(email.trim(), password);
  };

  return (
    <main className="login-page d-flex align-items-center justify-content-center vh-100">
      <div className="card shadow-lg p-4" style={{ maxWidth: 400, width: "90%" }}>
        <h1 className="h3 text-center mb-4 fw-bold text-primary">Admin Login</h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">
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
            <label htmlFor="password" className="form-label fw-semibold">
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
            className="btn btn-primary w-100 btn-lg"
            disabled={isLoggingIn}
          >
            {isLoggingIn ? <Spinner /> : "Login"}
          </button>
        </form>
      </div>
    </main>
  );
}
