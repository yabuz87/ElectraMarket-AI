"use client";

import React, { useState,useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Spinner from "./Spinner";
import { useAuthStore } from "../store/useAuthStore";

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { authUser, isLoggingIn, login, resendVerification } = useAuthStore();
  const [verificationRequired, setVerificationRequired] = useState(false);
  

  useEffect(() => {
    if (authUser) {
        router.replace("/");
        }},[authUser, router]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.email || !form.password) {
      setError("Please fill all fields");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
      let data= {
        email: form.email,
        password: form.password
      };

      const result = await login(data);
      setVerificationRequired(result?.code === "EMAIL_NOT_VERIFIED");
  };

  return (
    <div className="auth-page container">
      <div className="auth-card">
      <h2 className="mb-4 text-center text-primary">Welcome Back</h2>
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="alert alert-danger">{error}</div>}
        {verificationRequired && (
          <div className="alert alert-warning">
            <div>Please verify your email before logging in.</div>
            <button
              type="button"
              className="btn btn-link p-0 mt-2"
              onClick={() => resendVerification(form.email.trim())}
            >
              Resend verification email
            </button>
          </div>
        )}

        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email address</label>
          <input
            type="email"
            name="email"
            id="email"
            className="form-control"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter your password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={isLoggingIn}>
          {isLoggingIn ? <Spinner/> : "Log In"}
        </button>

        <p className="mt-3 text-center">
          Don't have an account?{" "}
          <Link href="/signup" className="text-primary">Sign Up</Link>
        </p>
      </form>
      </div>
    </div>
  );
}
