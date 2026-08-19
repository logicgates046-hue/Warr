"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("id, war_number, full_name, created_at")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!userProfile) {
        setError(
          "Your account exists, but your WAR profile has not been created yet."
        );
        return;
      }

      setProfile(userProfile);
    } catch (err) {
      setError(err.message || "Unable to load your WAR dashboard.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-container">
          <p>LOADING WAR...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-container">

        <header className="dashboard-header">
          <div>
            <p className="eyebrow">WAR</p>
            <h1>YOUR WAR</h1>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            LOG OUT
          </button>
        </header>

        {error ? (
          <section className="dashboard-error">
            <p className="error-message">{error}</p>

            <a href="/register" className="dashboard-button">
              COMPLETE PROFILE
            </a>
          </section>
        ) : (
          <>
            <section className="profile-panel">
              <div>
                <span className="profile-label">WAR NUMBER</span>

                <strong className="war-number">
                  {profile?.war_number}
                </strong>
              </div>

              <div>
                <span className="profile-label">NAME</span>

                <strong>{profile?.full_name}</strong>
              </div>

              <div>
                <span className="profile-label">ACCOUNT</span>

                <strong>{user?.email}</strong>
              </div>
            </section>

            <section className="dashboard-intro">
              <p className="eyebrow">WHICH ARE YOU IN?</p>

              <h2>MAKE YOUR VOICE HEARD.</h2>

              <p>
                Enter the current battle, cast your vote and follow the
                results.
              </p>
            </section>

            <section className="dashboard-grid">

              <a href="/vote" className="dashboard-card">
                <span className="card-number">01</span>

                <h3>VOTE</h3>

                <p>
                  Choose your side in the current WAR battle.
                </p>

                <span className="card-link">
                  ENTER BATTLE →
                </span>
              </a>

              <a href="/results" className="dashboard-card">
                <span className="card-number">02</span>

                <h3>RESULTS</h3>

                <p>
                  See the latest vote totals and percentages.
                </p>

                <span className="card-link">
                  VIEW RESULTS →
                </span>
              </a>

              <a href="/candidature" className="dashboard-card">
                <span className="card-number">03</span>

                <h3>CANDIDATURE</h3>

                <p>
                  Explore candidates and available positions.
                </p>

                <span className="card-link">
                  VIEW CANDIDATES →
                </span>
              </a>

            </section>
          </>
        )}

      </section>
    </main>
  );
}
