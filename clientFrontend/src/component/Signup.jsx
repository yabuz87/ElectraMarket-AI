"use client";

import React, { useState,useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/useAuthStore";
import Spinner from "./Spinner";

export default function Signup() {
  const router = useRouter();
  const { authUser,isSigningUp,signup } = useAuthStore();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

    useEffect(() => {
      if (authUser) {
          router.replace("/");
          }},[authUser, router]);
  const [error, setError] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.fullName || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      setError("Please fill all fields");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
     

        let data={
            fullName:form.fullName,
            email:form.email,
            phone:form.phone,
            password:form.password
           }
        const result = await signup(data);
        if (result?.verificationRequired) {
          setVerificationMessage(
            `We sent a verification link to ${result.email}. Verify it before logging in.`
          );
          setForm((current) => ({ ...current, password: "", confirmPassword: "" }));
        }
      
    }
  return (
    <div className="auth-page container">
      <div className="auth-card auth-card--wide">
      <h2 className="mb-4 text-center text-primary">Create an Account</h2>
      <form onSubmit={handleSubmit} noValidate>
        {error && <div className="alert alert-danger">{error}</div>}
        {verificationMessage && (
          <div className="alert alert-success">{verificationMessage}</div>
        )}

        <div className="mb-3">
          <label htmlFor="fullName" className="form-label">Full Name</label>
          <input
            type="text"
            name="fullName"
            id="fullName"
            className="form-control"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Your full name"
            required
          />
        </div>

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

        <div className="mb-3">
          <label htmlFor="phone" className="form-label">Phone Number</label>
          <input
            type="tel"
            name="phone"
            id="phone"
            className="form-control"
            value={form.phone}
            onChange={handleChange}
            placeholder="+251 9xxxxxxxx"
            required
          />
        </div>

        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            className="form-control"
            value={form.password}
            onChange={handleChange}
            placeholder="At least 6 characters"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            className="form-control"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="Re-enter your password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={isSigningUp}>
          { isSigningUp ? <Spinner/> : "Sign Up"}
        </button>

        <p className="mt-3 text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary">Log In</Link>
        </p>
      </form>
      </div>
    </div>
  );
}
