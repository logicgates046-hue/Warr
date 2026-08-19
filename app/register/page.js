"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please complete all fields.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!data.user) {
        throw new Error("Registration could not be completed.");
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: name.trim(),
          email: email.trim(),
        });

      if (profileError) {
        throw profileError;
      }

      setMessage(
        "Account created successfully. Check your email if confirmation is required."
      );

      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err.message || "Something went wrong during registration.");
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

        <h1>CREATE YOUR ACCOUNT</h1>

        <p className="auth-description">
          Register to enter WAR and make your voice heard.
        </p>

        <form onSubmit={handleRegister} className="auth-form">
          <label htmlFor="name">FULL NAME</label>

          <input
            id="name"
            type="text"
            placeholder="Your full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />

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
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
          />

          {error && <p className="form-error">{error}</p>}

          {message && <p className="form-success">{message}</p>}

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? "CREATING ACCOUNT..." : "CREATE WAR ACCOUNT"}
          </button>
        </form>

        <p className="auth-footer">
          Already have a WAR account?{" "}
          <a href="/login">LOGIN</a>
        </p>
      </section>
    </main>
  );
}
