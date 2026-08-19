"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ResultsPage() {
  const [battle, setBattle] = useState(null);
  const [wantamVotes, setWantamVotes] = useState(0);
  const [tutamVotes, setTutamVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    setLoading(true);
    setError("");

    try {
      const { data: activeBattle, error: battleError } = await supabase
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

      const { data: votes, error: votesError } = await supabase
        .from("stage1_votes")
        .select("side")
        .eq("battle_id", activeBattle.id);

      if (votesError) {
        throw votesError;
      }

      const wantam = (votes || []).filter(
        (vote) => vote.side === "WANTAM"
      ).length;

      const tutam = (votes || []).filter(
        (vote) => vote.side === "TUTAM"
      ).length;

      setWantamVotes(wantam);
      setTutamVotes(tutam);
    } catch (err) {
      setError(err.message || "Unable to load results.");
    } finally {
      setLoading(false);
    }
  }

  const totalVotes = wantamVotes + tutamVotes;

  const wantamPercentage =
    totalVotes > 0 ? (wantamVotes / totalVotes) * 100 : 0;

  const tutamPercentage =
    totalVotes > 0 ? (tutamVotes / totalVotes) * 100 : 0;

  if (loading) {
    return (
      <main className="vote-page">
        <section className="vote-container">
          <p>LOADING RESULTS...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="vote-page">
        <section className="vote-container">
          <a href="/" className="back-link">
            ← WAR
          </a>

          <p className="eyebrow">RESULTS</p>

          <h1>RESULTS UNAVAILABLE</h1>

          <p className="vote-message error-message">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="vote-page">
      <section className="vote-container results-container">
        <a href="/" className="back-link">
          ← WAR
        </a>

        <p className="eyebrow">WAR RESULTS</p>

        <h1>{battle?.name || "WHICH ARE YOU IN?"}</h1>

        {battle?.description && (
          <p className="vote-description">{battle.description}</p>
        )}

        <div className="total-votes">
          <span>TOTAL VOTES CAST</span>
          <strong>{totalVotes.toLocaleString()}</strong>
        </div>

        <section className="result-card wantam-result">
          <div className="result-header">
            <div>
              <span className="result-side-label">SIDE ONE</span>
              <h2>WANTAM</h2>
            </div>

            <strong className="result-percentage">
              {wantamPercentage.toFixed(1)}%
            </strong>
          </div>

          <div className="result-bar">
            <div
              className="result-fill wantam-fill"
              style={{ width: `${wantamPercentage}%` }}
            />
          </div>

          <p className="vote-count">
            {wantamVotes.toLocaleString()} votes
          </p>
        </section>

        <section className="result-card tutam-result">
          <div className="result-header">
            <div>
              <span className="result-side-label">SIDE TWO</span>
              <h2>TUTAM</h2>
            </div>

            <strong className="result-percentage">
              {tutamPercentage.toFixed(1)}%
            </strong>
          </div>

          <div className="result-bar">
            <div
              className="result-fill tutam-fill"
              style={{ width: `${tutamPercentage}%` }}
            />
          </div>

          <p className="vote-count">
            {tutamVotes.toLocaleString()} votes
          </p>
        </section>

        <div className="results-actions">
          <a href="/vote" className="vote-button">
            BACK TO VOTE
          </a>
        </div>
      </section>
    </main>
  );
      }
