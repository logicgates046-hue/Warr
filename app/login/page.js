"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      setLoading(false);
      return;
    }

    try {
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <a href="/" className="back-link">
          ← WAR
        </a>

        <p className="eyebrow">WAR</p>

        <h1>WELCOME BACK</h1>

        <p className="auth-description">
          Enter your WAR account to continue.
        </p>

        <form onSubmit={handleLogin} className="auth-form">
          <label htmlFor="email">EMAIL</label>

          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />

          <label htmlFor="password">PASSWORD</label>

          <input
            id="password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            className="auth-button"
            disabled={loading}
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>

        <p className="auth-footer">
          Don't have a WAR account?{" "}
          <a href="/register">REGISTER</a>
        </p>
      </section>
    </main>
  );
}
