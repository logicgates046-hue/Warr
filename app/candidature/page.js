"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function CandidaturePage() {
  const searchParams = useSearchParams();
  const selectedSide = searchParams.get("side");

  const [battle, setBattle] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadCandidature();
  }, [selectedSide]);

  async function loadCandidature() {
    setLoading(true);
    setError("");

    try {
      if (selectedSide !== "WANTAM" && selectedSide !== "TUTAM") {
        setError("No valid WAR side was selected.");
        return;
      }

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

      const { data: candidateData, error: candidateError } =
        await supabase
          .from("candidates")
          .select(
            "id, battle_id, name, role, side, image_url, created_at"
          )
          .eq("battle_id", activeBattle.id)
          .eq("side", selectedSide)
          .order("created_at", { ascending: true });

      if (candidateError) {
        throw candidateError;
      }

      setCandidates(candidateData || []);

      const { data: ticketData, error: ticketError } =
        await supabase
          .from("tickets")
          .select(
            "id, battle_id, side, president_id, deputy_id, created_at"
          )
          .eq("battle_id", activeBattle.id)
          .eq("side", selectedSide)
          .order("created_at", { ascending: true });

      if (ticketError) {
        throw ticketError;
      }

      setTickets(ticketData || []);
    } catch (err) {
      setError(
        err.message || "Unable to load the candidature."
      );
    } finally {
      setLoading(false);
    }
  }

  function getCandidateName(candidateId) {
    const candidate = candidates.find(
      (item) => item.id === candidateId
    );

    return candidate?.name || "Candidate";
  }

  function getCandidateRole(candidateId) {
    const candidate = candidates.find(
      (item) => item.id === candidateId
    );

    return candidate?.role || "";
  }

  function handleTicketSelection(ticketId) {
    window.location.href =
      `/stage2-vote?ticket=${encodeURIComponent(ticketId)}&side=${encodeURIComponent(
        selectedSide
      )}`;
  }

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

  return (
    <main className="vote-page">
      <section className="vote-container candidature-container">

        <a href="/dashboard" className="back-link">
          ← DASHBOARD
        </a>

        <p className="eyebrow">STAGE 2</p>

        <h1>{selectedSide}</h1>

        {battle?.description && (
          <p className="vote-description">
            {battle.description}
          </p>
        )}

        <section className="candidate-side-section">
          <div className="candidate-section-header">
            <span>
              {selectedSide === "WANTAM" ? "01" : "02"}
            </span>

            <h2>CANDIDATURE</h2>
          </div>

          {candidates.length === 0 ? (
            <p className="empty-candidates">
              No candidates have been added to this side yet.
            </p>
          ) : (
            <div className="candidate-grid">
              {candidates.map((candidate) => (
                <article
                  key={candidate.id}
                  className="candidate-card"
                >
                  {candidate.image_url ? (
                    <img
                      src={candidate.image_url}
                      alt={candidate.name}
                      className="candidate-image"
                    />
                  ) : (
                    <div className="candidate-placeholder">
                      {candidate.name
                        ?.charAt(0)
                        ?.toUpperCase() || "?"}
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
              ))}
            </div>
          )}
        </section>

        <section className="candidate-side-section">

          <div className="candidate-section-header">
            <span>TICKETS</span>

            <h2>CHOOSE</h2>
          </div>

          {tickets.length === 0 ? (
            <p className="empty-candidates">
              No tickets have been created for this side yet.
            </p>
          ) : (
            <div className="ticket-grid">

              {tickets.map((ticket, index) => (
                <article
                  key={ticket.id}
                  className="ticket-card"
                >
                  <span className="ticket-number">
                    TICKET {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="ticket-person">
                    <span>PRESIDENT</span>

                    <strong>
                      {getCandidateName(ticket.president_id)}
                    </strong>

                    <small>
                      {getCandidateRole(ticket.president_id)}
                    </small>
                  </div>

                  <div className="ticket-divider" />

                  <div className="ticket-person">
                    <span>DEPUTY</span>

                    <strong>
                      {getCandidateName(ticket.deputy_id)}
                    </strong>

                    <small>
                      {getCandidateRole(ticket.deputy_id)}
                    </small>
                  </div>

                  <button
                    type="button"
                    className="ticket-button"
                    onClick={() =>
                      handleTicketSelection(ticket.id)
                    }
                  >
                    SELECT THIS TICKET →
                  </button>
                </article>
              ))}

            </div>
          )}
        </section>

      </section>
    </main>
  );
}
