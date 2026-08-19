"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleRegister(event) {
    event.preventDefault();

    if (loading) return;

    setError("");
    setMessage("");

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Create the authentication account
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (signUpError) {
        const errorMessage = signUpError.message.toLowerCase();

        if (
          errorMessage.includes("rate") ||
          errorMessage.includes("too many")
        ) {
          throw new Error(
            "Too many registration attempts. Please wait and try again later."
          );
        }

        throw signUpError;
      }

      if (!data.user) {
        throw new Error("Registration could not be completed.");
      }

      // Create the WAR profile.
      // war_number is generated automatically by the database.
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          full_name: cleanName,
        })
        .select("id, war_number, full_name")
        .single();

      if (profileError) {
        throw profileError;
      }

      setMessage(
        `Account created successfully! Your WAR Number is ${profile.war_number}.`
      );

      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(
        err.message || "Something went wrong during registration."
      );
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

          <button
            type="submit"
            disabled={loading}
            className="auth-button"
          >
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
