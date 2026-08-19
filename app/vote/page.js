"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function VotePage() {
  const [user, setUser] = useState(null);
  const [battle, setBattle] = useState(null);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [selectedSide, setSelectedSide] = useState("");

  useEffect(() => {
    loadVotePage();
  }, []);

  async function loadVotePage() {
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

      const { data: activeBattle, error: battleError } =
        await supabase
          .from("battles")
          .select("id, name, description, status")
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

      if (battleError) {
        throw battleError;
      }

      if (!activeBattle) {
        setError(
          "There is currently no active WAR battle."
        );
        return;
      }

      setBattle(activeBattle);
    } catch (err) {
      setError(
        err.message || "Unable to load the voting page."
      );
    } finally {
      setLoading(false);
    }
  }

  async function castStage1Vote(side) {
    if (voting || !user || !battle) return;

    setVoting(true);
    setError("");
    setMessage("");

    try {
      /*
       * Record the Stage 1 vote.
       *
       * The database has a UNIQUE constraint on:
       * user_id + battle_id
       *
       * This prevents the same user from voting twice
       * in the same battle.
       */

      const { error: voteError } = await supabase
        .from("stage1_votes")
        .insert({
          user_id: user.id,
          battle_id: battle.id,
          side: side,
        });

      if (voteError) {
        if (voteError.code === "23505") {
          setError(
            "You have already voted in Stage 1."
          );

          setVoting(false);
          return;
        }

        throw voteError;
      }

      setMessage("Stage 1 vote recorded.");

      /*
       * After Stage 1, send the voter to the
       * candidature page for the side they selected.
       */

      window.location.href =
        `/candidature?side=${encodeURIComponent(side)}`;
    } catch (err) {
      setError(
        err.message ||
          "Your Stage 1 vote could not be recorded."
      );

      setVoting(false);
    }
  }

  if (loading) {
    return (
      <main className="vote-page">
        <section className="vote-container">
          <p>LOADING WAR...</p>
        </section>
      </main>
    );
  }

  if (error && !battle) {
    return (
      <main className="vote-page">
        <section className="vote-container">

          <a
            href="/dashboard"
            className="back-link"
          >
            ← DASHBOARD
          </a>

          <p className="eyebrow">
            WHICH ARE YOU IN?
          </p>

          <h1>WAR.</h1>

          <p className="vote-message error-message">
            {error}
          </p>

        </section>
      </main>
    );
  }

  return (
    <main className="vote-page">
      <section className="vote-container">

        <a
          href="/dashboard"
          className="back-link"
        >
          ← DASHBOARD
        </a>

        <header className="vote-header">

          <p className="eyebrow">
            {battle?.name || "WAR"}
          </p>

          <h1>
            WHICH ARE
            <br />
            YOU IN?
          </h1>

          {battle?.description && (
            <p className="vote-description">
              {battle.description}
            </p>
          )}

        </header>

        <div className="side-selection">

          <button
            type="button"
            className={`side-card ${
              selectedSide === "WANTAM"
                ? "selected"
                : ""
            }`}
            disabled={voting}
            onClick={() => {
              setSelectedSide("WANTAM");
              castStage1Vote("WANTAM");
            }}
          >

            <span className="side-number">
              01
            </span>

            <div>
              <span className="side-label">
                SIDE
              </span>

              <h2>WANTAM</h2>

              <p>
                WHO ARE YOU IN?
              </p>
            </div>

            <span className="side-arrow">
              →
            </span>

          </button>

          <button
            type="button"
            className={`side-card ${
              selectedSide === "TUTAM"
                ? "selected"
                : ""
            }`}
            disabled={voting}
            onClick={() => {
              setSelectedSide("TUTAM");
              castStage1Vote("TUTAM");
            }}
          >

            <span className="side-number">
              02
            </span>

            <div>
              <span className="side-label">
                SIDE
              </span>

              <h2>TUTAM</h2>

              <p>
                WHO ARE YOU IN?
              </p>
            </div>

            <span className="side-arrow">
              →
            </span>

          </button>

        </div>

        {voting && (
          <p className="vote-message">
            RECORDING YOUR VOTE...
          </p>
        )}

        {message && (
          <p className="vote-message">
            {message}
          </p>
        )}

        {error && (
          <p className="vote-message error-message">
            {error}
          </p>
        )}

        <p className="vote-footer">
          YOUR STAGE 1 VOTE CAN ONLY BE CAST ONCE.
        </p>

      </section>
    </main>
  );
              }
