"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function ResultsPage() {
  const [battle, setBattle] = useState(null);

  const [stage1Results, setStage1Results] = useState([]);
  const [stage2Results, setStage2Results] = useState([]);

  const [candidates, setCandidates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResults();
  }, []);

  async function loadResults() {
    setLoading(true);
    setError("");

    try {
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

      /*
       * =========================
       * STAGE 1 RESULTS
       * =========================
       */

      const { data: stage1Data, error: stage1Error } =
        await supabase.rpc("get_stage1_results", {
          p_battle_id: activeBattle.id,
        });

      if (stage1Error) {
        throw stage1Error;
      }

      setStage1Results(stage1Data || []);

      /*
       * =========================
       * STAGE 2 RESULTS
       * =========================
       */

      const { data: stage2Data, error: stage2Error } =
        await supabase.rpc("get_stage2_results", {
          p_battle_id: activeBattle.id,
        });

      if (stage2Error) {
        throw stage2Error;
      }

      setStage2Results(stage2Data || []);

      /*
       * =========================
       * CANDIDATES
       * =========================
       */

      const { data: candidateData, error: candidateError } =
        await supabase
          .from("candidates")
          .select(
            "id, name, role, side, image_url"
          )
          .eq("battle_id", activeBattle.id);

      if (candidateError) {
        throw candidateError;
      }

      setCandidates(candidateData || []);
    } catch (err) {
      setError(
        err.message || "Unable to load election results."
      );
    } finally {
      setLoading(false);
    }
  }

  function getCandidate(candidateId) {
    return candidates.find(
      (candidate) => candidate.id === candidateId
    );
  }

  function getCandidateName(candidateId) {
    return getCandidate(candidateId)?.name || "Unknown";
  }

  function getCandidateImage(candidateId) {
    return getCandidate(candidateId)?.image_url || "";
  }

  if (loading) {
    return (
      <main className="results-page">
        <section className="results-container">
          <p>LOADING RESULTS...</p>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="results-page">
        <section className="results-container">

          <a href="/dashboard" className="back-link">
            ← DASHBOARD
          </a>

          <p className="eyebrow">WAR RESULTS</p>

          <h1>UNAVAILABLE</h1>

          <p className="results-error">
            {error}
          </p>

        </section>
      </main>
    );
  }

  return (
    <main className="results-page">
      <section className="results-container">

        <a href="/dashboard" className="back-link">
          ← DASHBOARD
        </a>

        <header className="results-header">
          <p className="eyebrow">WAR RESULTS</p>

          <h1>
            {battle?.name || "RESULTS"}
          </h1>

          {battle?.description && (
            <p className="results-description">
              {battle.description}
            </p>
          )}
        </header>

        {/* =========================
            STAGE 1
            ========================= */}

        <section className="results-section">

          <div className="results-section-heading">
            <span>01</span>

            <div>
              <p className="eyebrow">STAGE 1</p>

              <h2>WHICH ARE YOU IN?</h2>
            </div>
          </div>

          {stage1Results.length === 0 ? (
            <p className="empty-results">
              No Stage 1 votes have been recorded yet.
            </p>
          ) : (
            <div className="results-list">

              {stage1Results.map((result) => (
                <article
                  key={result.side}
                  className="result-card"
                >

                  <div className="result-top">
                    <div>
                      <span className="result-label">
                        SIDE
                      </span>

                      <h3>{result.side}</h3>
                    </div>

                    <div className="result-number">
                      <strong>
                        {Number(result.total_votes).toLocaleString()}
                      </strong>

                      <span>VOTES</span>
                    </div>
                  </div>

                  <div className="result-percentage">
                    <strong>
                      {Number(result.percentage).toFixed(2)}%
                    </strong>
                  </div>

                  <div className="result-bar">
                    <div
                      className="result-bar-fill"
                      style={{
                        width: `${Number(
                          result.percentage
                        )}%`,
                      }}
                    />
                  </div>

                </article>
              ))}

            </div>
          )}
        </section>

        {/* =========================
            STAGE 2
            ========================= */}

        <section className="results-section">

          <div className="results-section-heading">
            <span>02</span>

            <div>
              <p className="eyebrow">STAGE 2</p>

              <h2>TICKET RESULTS</h2>
            </div>
          </div>

          {stage2Results.length === 0 ? (
            <p className="empty-results">
              No Stage 2 votes have been recorded yet.
            </p>
          ) : (
            <div className="ticket-results-list">

              {stage2Results.map((result, index) => {

                const president =
                  getCandidate(result.president_id);

                const deputy =
                  getCandidate(result.deputy_id);

                return (
                  <article
                    key={result.ticket_id}
                    className="ticket-result-card"
                  >

                    <div className="ticket-result-header">

                      <span className="ticket-result-number">
                        TICKET{" "}
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="ticket-result-side">
                        {result.side}
                      </span>

                    </div>

                    <div className="ticket-result-people">

                      <div className="result-person">

                        {getCandidateImage(
                          result.president_id
                        ) ? (
                          <img
                            src={getCandidateImage(
                              result.president_id
                            )}
                            alt={getCandidateName(
                              result.president_id
                            )}
                          />
                        ) : (
                          <div className="result-person-placeholder">
                            P
                          </div>
                        )}

                        <div>
                          <span>PRESIDENT</span>

                          <strong>
                            {president?.name ||
                              "Unknown"}
                          </strong>
                        </div>

                      </div>

                      <div className="result-person">

                        {getCandidateImage(
                          result.deputy_id
                        ) ? (
                          <img
                            src={getCandidateImage(
                              result.deputy_id
                            )}
                            alt={getCandidateName(
                              result.deputy_id
                            )}
                          />
                        ) : (
                          <div className="result-person-placeholder">
                            D
                          </div>
                        )}

                        <div>
                          <span>DEPUTY</span>

                          <strong>
                            {deputy?.name ||
                              "Unknown"}
                          </strong>
                        </div>

                      </div>

                    </div>

                    <div className="ticket-result-votes">

                      <div>
                        <strong>
                          {Number(
                            result.total_votes
                          ).toLocaleString()}
                        </strong>

                        <span>VOTES</span>
                      </div>

                      <strong>
                        {Number(
                          result.percentage
                        ).toFixed(2)}
                        %
                      </strong>

                    </div>

                    <div className="result-bar">
                      <div
                        className="result-bar-fill"
                        style={{
                          width: `${Number(
                            result.percentage
                          )}%`,
                        }}
                      />
                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

      </section>
    </main>
  );
                        }
