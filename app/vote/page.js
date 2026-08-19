"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function VotePage() {
  const [user, setUser] = useState(null);
  const [battle, setBattle] = useState(null);
  const [selectedSide, setSelectedSide] = useState("");
  const [existingVote, setExistingVote] = useState(null);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

      const { data: activeBattle, error: battleError } = await supabase
        .from("battles")
        .select("id, name, description, status, created_at")
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

  async function submitVote() {
    if (!user || !battle || !selectedSide || voting || existingVote) {
      return;
    }

    setVoting(true);
    setError("");
    setMessage("");

    try {
      const { data: alreadyVoted, error: checkError } = await supabase
        .from("stage1_votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("battle_id", battle.id)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }

      if (alreadyVoted) {
        setExistingVote(alreadyVoted);
        setError("You have already voted in this battle.");
        return;
      }

      const { data: newVote, error: insertError } = await supabase
        .from("stage1_votes")
        .insert({
          user_id: user.id,
          battle_id: battle.id,
          side: selectedSide,
        })
        .select("id, side, created_at")
        .single();

      if (insertError) {
        throw insertError;
      }

      setExistingVote(newVote);
      setMessage(
        `Your Stage 1 vote for ${selectedSide} has been recorded.`
      );
    } catch (err) {
      if (
        err.code === "23505" ||
        err.message?.toLowerCase().includes("duplicate")
      ) {
        setError("You have already voted in this battle.");
      } else {
        setError(err.message || "Your vote could not be recorded.");
      }
    } finally {
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <main className="vote-page">
        <section className="vote-card">
          <p>LOADING WAR...</p>
        </section>
      </main>
    );
  }

  if (error && !battle) {
    return (
      <main className="vote-page">
        <section className="vote-card">
          <a href="/" className="back-link">
            ← WAR
          </a>

          <p className="eyebrow">WAR</p>

          <h1>WAR IS CURRENTLY UNAVAILABLE</h1>

          <p className="vote-message error-message">{error}</p>

          <a href="/login" className="vote-button">
            BACK TO LOGIN
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="vote-page">
      <section className="vote-container">
        <a href="/" className="back-link">
          ← WAR
        </a>

        <p className="eyebrow">WHICH ARE YOU IN?</p>

        <h1>{battle?.name || "WAR"}</h1>

        {battle?.description && (
          <p className="vote-description">{battle.description}</p>
        )}

        {existingVote ? (
          <section className="already-voted">
            <p className="eyebrow">VOTE RECORDED</p>

            <h2>YOU ARE IN.</h2>

            <p>
              Your Stage 1 vote has already been recorded for this battle.
            </p>

            <div className="recorded-side">
              {existingVote.side}
            </div>

            <a href="/results" className="vote-button">
              VIEW RESULTS
            </a>
          </section>
        ) : (
          <>
            <p className="instruction">
              Choose your side. You can vote only once.
            </p>

            <div className="sides-grid">
              <button
                type="button"
                className={`side-choice wantam-choice ${
                  selectedSide === "WANTAM" ? "selected" : ""
                }`}
                onClick={() => setSelectedSide("WANTAM")}
              >
                <span className="side-label">SIDE ONE</span>
                <strong>WANTAM</strong>
                <span>We want them.</span>
              </button>

              <button
                type="button"
                className={`side-choice tutam-choice ${
                  selectedSide === "TUTAM" ? "selected" : ""
                }`}
                onClick={() => setSelectedSide("TUTAM")}
              >
                <span className="side-label">SIDE TWO</span>
                <strong>TUTAM</strong>
                <span>We don't want them.</span>
              </button>
            </div>

            {error && <p className="vote-message error-message">{error}</p>}

            {message && (
              <p className="vote-message success-message">{message}</p>
            )}

            <button
              type="button"
              className="confirm-vote-button"
              disabled={!selectedSide || voting}
              onClick={submitVote}
            >
              {voting ? "RECORDING VOTE..." : "CONFIRM MY VOTE"}
            </button>
          </>
        )}
      </section>
    </main>
  );
      }
