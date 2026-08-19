"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Stage2VotePage() {
  const searchParams = useSearchParams();

  const ticketId = searchParams.get("ticket");
  const side = searchParams.get("side");

  const [user, setUser] = useState(null);
  const [battle, setBattle] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [president, setPresident] = useState(null);
  const [deputy, setDeputy] = useState(null);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTicket();
  }, [ticketId, side]);

  async function loadTicket() {
    setLoading(true);
    setError("");

    try {
      if (!ticketId) {
        setError("No ticket was selected.");
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

      const { data: selectedTicket, error: ticketError } =
        await supabase
          .from("tickets")
          .select(
            "id, battle_id, side, president_id, deputy_id, created_at"
          )
          .eq("id", ticketId)
          .eq("battle_id", activeBattle.id)
          .maybeSingle();

      if (ticketError) {
        throw ticketError;
      }

      if (!selectedTicket) {
        setError("The selected ticket could not be found.");
        return;
      }

      if (side && selectedTicket.side !== side) {
        setError("This ticket does not belong to your selected side.");
        return;
      }

      setTicket(selectedTicket);

      const candidateIds = [
        selectedTicket.president_id,
        selectedTicket.deputy_id,
      ];

      const { data: candidateData, error: candidateError } =
        await supabase
          .from("candidates")
          .select("id, name, role, side, image_url")
          .in("id", candidateIds);

      if (candidateError) {
        throw candidateError;
      }

      const presidentCandidate = candidateData?.find(
        (candidate) =>
          candidate.id === selectedTicket.president_id
      );

      const deputyCandidate = candidateData?.find(
        (candidate) =>
          candidate.id === selectedTicket.deputy_id
      );

      setPresident(presidentCandidate || null);
      setDeputy(deputyCandidate || null);
    } catch (err) {
      setError(
        err.message || "Unable to load the selected ticket."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVote() {
    if (voting || !user || !battle || !ticket) return;

    setVoting(true);
    setError("");

    try {
      const { error: voteError } = await supabase
        .from("stage2_votes")
        .insert({
          user_id: user.id,
          battle_id: battle.id,
          ticket_id: ticket.id,
        });

      if (voteError) {
        if (voteError.code === "23505") {
          setError("You have already voted in Stage 2.");
          setVoting(false);
          return;
        }

        throw voteError;
      }

      /*
       * Stage 2 is complete.
       * Send the user to the community page.
       */
      window.location.href =
        `/community?side=${encodeURIComponent(ticket.side)}`;
    } catch (err) {
      setError(
        err.message || "Your Stage 2 vote could not be recorded."
      );
      setVoting(false);
    }
  }

  if (loading) {
    return (
      <main className="vote-page">
        <section className="vote-container">
          <p>LOADING TICKET...</p>
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

          <p className="eyebrow">STAGE 2</p>

          <h1>UNAVAILABLE</h1>

          <p className="vote-message error-message">
            {error}
          </p>

          <a
            href={`/candidature?side=${encodeURIComponent(
              side || ""
            )}`}
            className="vote-button"
          >
            BACK TO CANDIDATURE
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="vote-page">
      <section className="vote-container stage2-container">

        <a
          href={`/candidature?side=${encodeURIComponent(
            ticket.side
          )}`}
          className="back-link"
        >
          ← BACK TO CANDIDATURE
        </a>

        <p className="eyebrow">STAGE 2 — FINAL CHOICE</p>

        <h1>{ticket.side}</h1>

        <p className="vote-description">
          Review your selected ticket before casting your
          Stage 2 vote.
        </p>

        <section className="selected-ticket">

          <span className="ticket-number">
            SELECTED TICKET
          </span>

          <div className="stage2-person">
            {president?.image_url ? (
              <img
                src={president.image_url}
                alt={president.name}
                className="stage2-image"
              />
            ) : (
              <div className="stage2-placeholder">
                {president?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "P"}
              </div>
            )}

            <div>
              <span>PRESIDENT</span>

              <h2>
                {president?.name || "Unknown candidate"}
              </h2>

              <small>
                {president?.role || ""}
              </small>
            </div>
          </div>

          <div className="stage2-divider" />

          <div className="stage2-person">
            {deputy?.image_url ? (
              <img
                src={deputy.image_url}
                alt={deputy.name}
                className="stage2-image"
              />
            ) : (
              <div className="stage2-placeholder">
                {deputy?.name
                  ?.charAt(0)
                  ?.toUpperCase() || "D"}
              </div>
            )}

            <div>
              <span>DEPUTY</span>

              <h2>
                {deputy?.name || "Unknown candidate"}
              </h2>

              <small>
                {deputy?.role || ""}
              </small>
            </div>
          </div>

        </section>

        <div className="stage2-warning">
          <strong>FINAL CHOICE</strong>

          <p>
            Your Stage 2 vote can only be cast once for this
            battle. Make sure your selection is correct before
            continuing.
          </p>
        </div>

        {error && (
          <p className="vote-message error-message">
            {error}
          </p>
        )}

        <button
          type="button"
          className="confirm-vote-button"
          onClick={handleVote}
          disabled={voting}
        >
          {voting
            ? "RECORDING FINAL VOTE..."
            : "CONFIRM STAGE 2 VOTE"}
        </button>

      </section>
    </main>
  );
    }
