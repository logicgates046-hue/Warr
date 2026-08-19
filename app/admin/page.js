"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [battles, setBattles] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [tickets, setTickets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
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

      const { data: currentProfile, error: profileError } =
        await supabase
          .from("profiles")
          .select("id, war_number, full_name, role")
          .eq("id", currentUser.id)
          .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!currentProfile || currentProfile.role !== "admin") {
        setAuthorized(false);
        return;
      }

      setProfile(currentProfile);
      setAuthorized(true);

      await loadAdminData();
    } catch (err) {
      setError(
        err.message || "Unable to verify administrator access."
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminData() {
    const [
      battlesResponse,
      candidatesResponse,
      ticketsResponse,
    ] = await Promise.all([
      supabase
        .from("battles")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false }),

      supabase
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (battlesResponse.error) {
      throw battlesResponse.error;
    }

    if (candidatesResponse.error) {
      throw candidatesResponse.error;
    }

    if (ticketsResponse.error) {
      throw ticketsResponse.error;
    }

    setBattles(battlesResponse.data || []);
    setCandidates(candidatesResponse.data || []);
    setTickets(ticketsResponse.data || []);
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-container">
          <p>VERIFYING ADMIN ACCESS...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="admin-page">
        <section className="admin-container">

          <p className="eyebrow">WAR ADMIN</p>

          <h1>ERROR</h1>

          <p className="admin-error">
            {error}
          </p>

          <a
            href="/dashboard"
            className="admin-secondary-button"
          >
            RETURN TO DASHBOARD
          </a>

        </section>
      </main>
    );
  }

  if (!authorized) {
    return (
      <main className="admin-page">
        <section className="admin-container">

          <p className="eyebrow">WAR ADMIN</p>

          <h1>ACCESS DENIED.</h1>

          <p className="admin-description">
            You do not have administrator privileges.
          </p>

          <a
            href="/dashboard"
            className="admin-secondary-button"
          >
            RETURN TO DASHBOARD
          </a>

        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-container">

        <header className="admin-header">

          <div>
            <p className="eyebrow">WAR ADMINISTRATION</p>

            <h1>DASHBOARD.</h1>

            <p className="admin-description">
              Welcome, {profile?.full_name || "Administrator"}.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="admin-logout"
          >
            LOG OUT
          </button>

        </header>

        <section className="admin-stats">

          <div className="admin-stat">
            <span>BATTLES</span>
            <strong>{battles.length}</strong>
          </div>

          <div className="admin-stat">
            <span>CANDIDATES</span>
            <strong>{candidates.length}</strong>
          </div>

          <div className="admin-stat">
            <span>TICKETS</span>
            <strong>{tickets.length}</strong>
          </div>

        </section>

        <section className="admin-menu">

          <a href="/admin/battles" className="admin-menu-card">
            <span>01</span>
            <div>
              <h2>BATTLES</h2>
              <p>
                Create and manage WAR battles.
              </p>
            </div>
            <strong>→</strong>
          </a>

          <a
            href="/admin/candidates"
            className="admin-menu-card"
          >
            <span>02</span>
            <div>
              <h2>CANDIDATES</h2>
              <p>
                Manage candidates and their sides.
              </p>
            </div>
            <strong>→</strong>
          </a>

          <a href="/admin/tickets" className="admin-menu-card">
            <span>03</span>
            <div>
              <h2>TICKETS</h2>
              <p>
                Create President and Deputy tickets.
              </p>
            </div>
            <strong>→</strong>
          </a>

          <a
            href="/admin/community"
            className="admin-menu-card"
          >
            <span>04</span>
            <div>
              <h2>COMMUNITIES</h2>
              <p>
                Manage WANTAM and TUTAM community links.
              </p>
            </div>
            <strong>→</strong>
          </a>

          <a
            href="/results"
            className="admin-menu-card"
          >
            <span>05</span>
            <div>
              <h2>RESULTS</h2>
              <p>
                View current election results.
              </p>
            </div>
            <strong>→</strong>
          </a>

        </section>

      </section>
    </main>
  );
  }
