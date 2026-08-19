"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function CandidatureContent() {
  const searchParams = useSearchParams();
  const side = searchParams.get("side");

  const [user, setUser] = useState(null);
  const [battle, setBattle] = useState(null);
  const [candidates, setCandidates] = useState([]);

  const [selectedCandidate, setSelectedCandidate] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadCandidature();
  }, []);

  async function loadCandidature() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

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

      if (battleError) throw battleError;

      if (!activeBattle) {
        setError(
          "There is currently no active WAR battle."
        );
        return;
      }

      setBattle(activeBattle);

      let query = supabase
        .from("candidates")
        .select(
          "id, battle_id, name, role, side, image_url"
        )
        .eq("battle_id", activeBattle.id);

      if (side) {
        query = query.eq("side", side);
      }

      const {
        data: candidateData,
        error: candidateError,
      } = await query.order("created_at", {
        ascending: true,
      });

      if (candidateError) throw candidateError;

      setCandidates(candidateData || []);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load the candidature page."
      );
    } finally {
      setLoading(false);
    }
  }

  function selectCandidate(candidate) {
    setSelectedCandidate(candidate);
    setMessage("");
    setError("");
  }

  async function continueToStage2() {
    if (!selectedCandidate) {
      setError(
        "Please select a candidate before continuing."
      );
      return;
    }

    /*
     * Stage 1 has already determined the user's side.
     * This page selects the candidature/ticket side.
     *
     * We now continue to Stage 2.
     */

    window.location.href =
      `/stage2-vote?side=${encodeURIComponent(
        side || selectedCandidate.side
      )}`;
  }

  if (loading) {
    return (
      <main className="candidature-page">
        <section className="candidature-container">
          <p>LOADING CANDIDATURE...</p>
        </section>
      </main>
    );
  }

  if (error && !battle) {
    return (
      <main className="candidature-page">
        <section className="candidature-container">

          <a
            href="/dashboard"
            className="back-link"
          >
            ← DASHBOARD
          </a>

          <p className="eyebrow">
            CANDIDATURE
          </p>

          <h1>UNAVAILABLE.</h1>

          <p className="candidature-error">
            {error}
          </p>

        </section>
      </main>
    );
  }

  return (
    <main className="candidature-page">
      <section className="candidature-container">

        <a
          href="/vote"
          className="back-link"
        >
          ← BACK TO STAGE 1
        </a>

        <header className="candidature-header">

          <p className="eyebrow">
            {battle?.name || "WAR"}
          </p>

          <h1>
            {side || "CANDIDATURE"}.
          </h1>

          <p className="candidature-description">
            Select the candidature you want to proceed
            with.
          </p>

        </header>

        {candidates.length === 0 ? (
          <div className="empty-candidates">
            <p>
              No candidates have been added for this
              side yet.
            </p>
          </div>
        ) : (
          <div className="candidate-list">

            {candidates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                className={`candidate-card ${
                  selectedCandidate?.id === candidate.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  selectCandidate(candidate)
                }
              >

                {candidate.image_url ? (
                  <img
                    src={candidate.image_url}
                    alt={candidate.name}
                    className="candidate-image"
                  />
                ) : (
                  <div className="candidate-image-placeholder">
                    {candidate.name
                      ?.charAt(0)
                      ?.toUpperCase() || "?"}
                  </div>
                )}

                <div className="candidate-information">

                  <span>
                    {candidate.role || "CANDIDATE"}
                  </span>

                  <h2>
                    {candidate.name}
                  </h2>

                  <small>
                    {candidate.side}
                  </small>

                </div>

                <div className="candidate-select">
                  {selectedCandidate?.id ===
                  candidate.id
                    ? "✓"
                    : "→"}
                </div>

              </button>
            ))}

          </div>
        )}

        {error && (
          <p className="candidature-error">
            {error}
          </p>
        )}

        {message && (
          <p className="candidature-message">
            {message}
          </p>
        )}

        {selectedCandidate && (
          <section className="candidature-continue">

            <p>
              SELECTED
            </p>

            <strong>
              {selectedCandidate.name}
            </strong>

            <button
              type="button"
              onClick={continueToStage2}
              disabled={voting}
            >
              CONTINUE TO STAGE 2 →
            </button>

          </section>
        )}

      </section>
    </main>
  );
}

function CandidatureFallback() {
  return (
    <main className="candidature-page">
      <section className="candidature-container">
        <p>LOADING CANDIDATURE...</p>
      </section>
    </main>
  );
}

export default function CandidaturePage() {
  return (
    <Suspense fallback={<CandidatureFallback />}>
      <CandidatureContent />
    </Suspense>
  );
          }
