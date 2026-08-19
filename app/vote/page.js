"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function VotePage() {
  const [battle, setBattle] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedSide, setSelectedSide] = useState("");
  const [existingVote, setExistingVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

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
        setError("There is currently no active WAR battle.");
        return;
      }

      setBattle(activeBattle);

      const { data: vote, error: voteError } = await supabase
        .from("stage1_votes")
        .select("id, side, created_at")
        .eq("user_id", currentUser.id)
        .eq("battle_id", activeBattle.id)
        .maybeSingle();

      if (voteError) {
        throw voteError;
      }

      if (vote) {
        setExistingVote(vote);
      }
    } catch (err) {
      setError(err.message || "Unable to load the voting page.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSideSelection(side) {
    if (voting || existingVote) return;

    setVoting(true);
    setError("");
    setSelectedSide(side);

    try {
      const { error: insertError } = await supabase
        .from("stage1_votes")
        .insert({
          user_id: user.id,
          battle_id: battle.id,
          side,
        });

      if (insertError) {
        if (insertError.code === "23505") {
          setError("You have already voted in Stage 1.");
          setVoting(false);
          return;
        }

        throw insertError;
      }

      /*
       * Stage 1 is now recorded.
       * The selected side is passed to candidature
       * so Stage 2 only shows that side.
       */
      window.location.href =
        `/candidature?side=${encodeURIComponent(side)}`;
    } catch (err) {
      setError(err.message || "Your vote could not be recorded.");
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
          <a href="/dashboard" className="back-link">
            ← DASHBOARD
          </a>

          <p className="eyebrow">STAGE 1</p>

          <h1>VOTING UNAVAILABLE</h1>

          <p className="vote-message error-message">
            {error}
          </p>
        </section>
      </main>
    );
  }

  if (existingVote) {
    return (
      <main className="vote-page">
        <section className="vote-container">
          <a href="/dashboard" className="back-link">
            ← DASHBOARD
          </a>

          <p className="eyebrow">STAGE 1 COMPLETE</p>

          <h1>YOU HAVE VOTED.</h1>

          <section className="already-voted">
            <p className="eyebrow">YOUR SIDE</p>

            <h2>{existingVote.side}</h2>

            <p>
              Your Stage 1 vote has already been recorded.
            </p>

            <a
              href={`/candidature?side=${encodeURIComponent(
                existingVote.side
              )}`}
              className="vote-button"
            >
              CONTINUE TO CANDIDATURE →
            </a>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="vote-page">
      <section className="vote-container">
        <a href="/dashboard" className="back-link">
          ← DASHBOARD
        </a>

        <p className="eyebrow">STAGE 1</p>

        <h1>
          {battle?.name || "WHICH ARE YOU IN?"}
        </h1>

        {battle?.description && (
          <p className="vote-description">
            {battle.description}
          </p>
        )}

        <p className="instruction">
          CHOOSE YOUR SIDE.
        </p>

        <div className="sides-grid">

          <button
            type="button"
            className={`side-choice wantam-choice ${
              selectedSide === "WANTAM" ? "selected" : ""
            }`}
            onClick={() => handleSideSelection("WANTAM")}
            disabled={voting}
          >
            <span className="side-label">SIDE ONE</span>

            <strong>WANTAM</strong>

            <span>
              {voting && selectedSide === "WANTAM"
                ? "RECORDING VOTE..."
                : "CHOOSE WANTAM →"}
            </span>
          </button>

          <button
            type="button"
            className={`side-choice tutam-choice ${
              selectedSide === "TUTAM" ? "selected" : ""
            }`}
            onClick={() => handleSideSelection("TUTAM")}
            disabled={voting}
          >
            <span className="side-label">SIDE TWO</span>

            <strong>TUTAM</strong>

            <span>
              {voting && selectedSide === "TUTAM"
                ? "RECORDING VOTE..."
                : "CHOOSE TUTAM →"}
            </span>
          </button>

        </div>

        {error && (
          <p className="vote-message error-message">
            {error}
          </p>
        )}

      </section>
    </main>
  );
}
