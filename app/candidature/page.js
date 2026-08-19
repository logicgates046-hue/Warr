"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function CandidaturePage() {
  const [battle, setBattle] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCandidates();
  }, []);

  async function loadCandidates() {
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

      const { data: candidateData, error: candidateError } =
        await supabase
          .from("candidates")
          .select(
            "id, battle_id, name, role, side, image_url, created_at"
          )
          .eq("battle_id", activeBattle.id)
          .order("created_at", { ascending: true });

      if (candidateError) {
        throw candidateError;
      }

      setCandidates(candidateData || []);
    } catch (err) {
      setError(err.message || "Unable to load candidates.");
    } finally {
      setLoading(false);
    }
  }

  const wantamCandidates = candidates.filter(
    (candidate) => candidate.side === "WANTAM"
  );

  const tutamCandidates = candidates.filter(
    (candidate) => candidate.side === "TUTAM"
  );

  if (loading) {
    return (
      <main className="vote-page">
        <section className="vote-container">
          <p>LOADING CANDIDATURE...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="vote-page">
        <section className="vote-container">
          <a href="/dashboard" className="back-link">
            ← DASHBOARD
          </a>

          <p className="eyebrow">CANDIDATURE</p>

          <h1>UNAVAILABLE</h1>

          <p className="vote-message error-message">
            {error}
          </p>
        </section>
      </main>
    );
  }

  function CandidateCard({ candidate }) {
    return (
      <article className="candidate-card">
        {candidate.image_url ? (
          <img
            src={candidate.image_url}
            alt={candidate.name}
            className="candidate-image"
          />
        ) : (
          <div className="candidate-placeholder">
            {candidate.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}

        <div className="candidate-info">
          <span className="candidate-role">
            {candidate.role || "CANDIDATE"}
          </span>

          <h3>{candidate.name}</h3>

          <span className="candidate-side">
            {candidate.side}
          </span>
        </div>
      </article>
    );
  }

  return (
    <main className="vote-page">
      <section className="vote-container candidature-container">
        <a href="/dashboard" className="back-link">
          ← DASHBOARD
        </a>

        <p className="eyebrow">WAR CANDIDATURE</p>

        <h1>
          {battle?.name || "CANDIDATES"}
        </h1>

        {battle?.description && (
          <p className="vote-description">
            {battle.description}
          </p>
        )}

        <section className="candidate-side-section wantam-candidates">
          <div className="candidate-section-header">
            <span>01</span>
            <h2>WANTAM</h2>
          </div>

          {wantamCandidates.length === 0 ? (
            <p className="empty-candidates">
              No candidates have been added yet.
            </p>
          ) : (
            <div className="candidate-grid">
              {wantamCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                />
              ))}
            </div>
          )}
        </section>

        <section className="candidate-side-section tutam-candidates">
          <div className="candidate-section-header">
            <span>02</span>
            <h2>TUTAM</h2>
          </div>

          {tutamCandidates.length === 0 ? (
            <p className="empty-candidates">
              No candidates have been added yet.
            </p>
          ) : (
            <div className="candidate-grid">
              {tutamCandidates.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
      }
