"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminBattlesPage() {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  async function checkAdminAndLoad() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      if (!profile || profile.role !== "admin") {
        window.location.href = "/dashboard";
        return;
      }

      await loadBattles();
    } catch (err) {
      setError(err.message || "Unable to load battles.");
    } finally {
      setLoading(false);
    }
  }

  async function loadBattles() {
    const { data, error: battlesError } = await supabase
      .from("battles")
      .select("*")
      .order("created_at", { ascending: false });

    if (battlesError) throw battlesError;

    setBattles(data || []);
  }

  async function createBattle(event) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Battle name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      /*
       * WAR should have only one active battle at a time.
       * If this new battle is active, close other active battles.
       */
      if (status === "active") {
        const { error: closeError } = await supabase
          .from("battles")
          .update({ status: "closed" })
          .eq("status", "active");

        if (closeError) throw closeError;
      }

      const { error: insertError } = await supabase
        .from("battles")
        .insert({
          name: name.trim(),
          description: description.trim(),
          status,
        });

      if (insertError) throw insertError;

      setName("");
      setDescription("");
      setStatus("draft");

      await loadBattles();

      setMessage("Battle created successfully.");
    } catch (err) {
      setError(err.message || "Unable to create battle.");
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(battle, newStatus) {
    setError("");
    setMessage("");

    try {
      if (newStatus === "active") {
        const { error: closeError } = await supabase
          .from("battles")
          .update({ status: "closed" })
          .eq("status", "active")
          .neq("id", battle.id);

        if (closeError) throw closeError;
      }

      const { error: updateError } = await supabase
        .from("battles")
        .update({ status: newStatus })
        .eq("id", battle.id);

      if (updateError) throw updateError;

      await loadBattles();

      setMessage("Battle status updated.");
    } catch (err) {
      setError(err.message || "Unable to update battle.");
    }
  }

  if (loading) {
    return (
      <main className="admin-page">
        <section className="admin-container">
          <p>LOADING BATTLES...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <section className="admin-container">

        <a href="/admin" className="back-link">
          ← ADMIN DASHBOARD
        </a>

        <header className="admin-header">
          <div>
            <p className="eyebrow">WAR ADMINISTRATION</p>
            <h1>BATTLES.</h1>
          </div>
        </header>

        {error && (
          <p className="admin-error">
            {error}
          </p>
        )}

        {message && (
          <p className="admin-success">
            {message}
          </p>
        )}

        <section className="admin-form-section">

          <div className="admin-section-title">
            <span>01</span>
            <h2>CREATE BATTLE</h2>
          </div>

          <form
            onSubmit={createBattle}
            className="admin-form"
          >
            <label>
              Battle Name

              <input
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                placeholder="Which Are You In?"
              />
            </label>

            <label>
              Description

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                placeholder="Describe this WAR battle..."
                rows="4"
              />
            </label>

            <label>
              Status

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value)
                }
              >
                <option value="draft">
                  Draft
                </option>

                <option value="active">
                  Active
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>
            </label>

            <button
              type="submit"
              className="admin-primary-button"
              disabled={saving}
            >
              {saving
                ? "CREATING..."
                : "CREATE BATTLE →"}
            </button>
          </form>

        </section>

        <section className="admin-form-section">

          <div className="admin-section-title">
            <span>02</span>
            <h2>EXISTING BATTLES</h2>
          </div>

          {battles.length === 0 ? (
            <p className="empty-admin">
              No battles have been created yet.
            </p>
          ) : (
            <div className="admin-battle-list">

              {battles.map((battle) => (
                <article
                  key={battle.id}
                  className="admin-battle-card"
                >
                  <div>
                    <span className="admin-battle-status">
                      {battle.status}
                    </span>

                    <h3>{battle.name}</h3>

                    {battle.description && (
                      <p>
                        {battle.description}
                      </p>
                    )}
                  </div>

                  <div className="admin-battle-actions">

                    {battle.status !== "active" && (
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            battle,
                            "active"
                          )
                        }
                      >
                        ACTIVATE
                      </button>
                    )}

                    {battle.status === "active" && (
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            battle,
                            "closed"
                          )
                        }
                      >
                        CLOSE
                      </button>
                    )}

                    {battle.status === "draft" && (
                      <button
                        type="button"
                        onClick={() =>
                          changeStatus(
                            battle,
                            "closed"
                          )
                        }
                      >
                        CLOSE
                      </button>
                    )}

                  </div>
                </article>
              ))}

            </div>
          )}

        </section>

      </section>
    </main>
  );
}
