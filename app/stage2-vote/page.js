"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "../../lib/supabase";

function Stage2VoteContent() {
  const searchParams = useSearchParams();
  const side = searchParams.get("side");

  const [user, setUser] = useState(null);
  const [battle, setBattle] = useState(null);
  const [tickets, setTickets] = useState([]);

  const [selectedTicket, setSelectedTicket] = useState(null);

  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadStage2();
  }, []);

  async function loadStage2() {
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

      if (!side) {
        setError(
          "No WAR side was selected."
        );
        return;
      }

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

      const { data: ticketData, error: ticketError } =
        await supabase
          .from("tickets")
          .select(
            "id, battle_id, side, president_id, deputy_id"
          )
          .eq("battle_id", activeBattle.id)
          .eq("side", side)
          .order("created_at", {
            ascending: true,
          });

      if (ticketError) throw ticketError;

      setTickets(ticketData || []);
    } catch (err) {
      setError(
        err.message ||
          "Unable to load Stage 2."
      );
    } finally {
      setLoading(false);
    }
  }

  async function castStage2Vote() {
    if (!selectedTicket || voting || !user || !battle) {
      return;
    }

    setVoting(true);
    setError("");
    setMessage("");

    try {
      /*
       * Stage 2 allows one vote per authenticated user
       * for the active battle.
       *
       * The database should enforce the unique
       * user_id + battle_id constraint.
       */

      const { error: voteError } = await supabase
        .from("stage2_votes")
        .insert({
          user_id: user.id,
          battle_id: battle.id,
          ticket_id: selectedTicket.id,
        });

      if (voteError) {
        if (voteError.code === "23505") {
          setError(
            "You have already voted in Stage 2."
          );

          setVoting(false);
          return;
        }

        throw voteError;
      }

      setMessage(
        "Stage 2 vote recorded successfully."
      );

      /*
       * Stage 2 is the final voting stage.
       * After voting, send the user to their
       * community page.
       */

      setTimeout(() => {
        window.location.href =
          `/community?side=${encodeURIComponent(
            side
          )}`;
      }, 800);
    } catch (err) {
      setError(
        err.message ||
          "Your Stage 2 vote could not be recorded."
      );

      setVoting(false);
    }
  }

  if (loading) {
    return (
      <main className="stage2-page">
        <section className="stage2-container">
          <p>LOADING STAGE 2...</p>
        </section>
      </main>
    );
  }

  if (error && !battle) {
    return (
      <main className="stage2-page">
        <section className="stage2-container">

          <a
            href="/dashboard"
            className="back-link"
          >
            ← DASHBOARD
          </a>

          <p className="eyebrow">
            STAGE 2
          </p>

          <h1>
            UNAVAILABLE.
          </h1>

          <p className="stage2-error">
            {error}
          </p>

        </section>
      </main>
    );
  }

  return (
    <main className="stage2-page">
      <section className="stage2-container">

        <a
          href={`/candidature?side=${encodeURIComponent(
            side || ""
          )}`}
          className="back-link"
        >
          ← BACK TO CANDIDATURE
        </a>

        <header className="stage2-header">

          <p className="eyebrow">
            {battle?.name || "WAR"}
          </p>

          <h1>
            STAGE 2.
          </h1>

          <p className="stage2-description">
            Select your preferred ticket.
          </p>

          <div className="stage2-side">
            SIDE: <strong>{side}</strong>
          </div>

        </header>

        {tickets.length === 0 ? (
          <div className="empty-tickets">
            <p>
              No tickets have been created for{" "}
              {side} yet.
            </p>
          </div>
        ) : (
          <div className="ticket-list">

            {tickets.map((ticket, index) => (
              <button
                key={ticket.id}
                type="button"
                className={`ticket-card ${
                  selectedTicket?.id === ticket.id
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setSelectedTicket(ticket)
                }
                disabled={voting}
              >

                <span className="ticket-number">
                  TICKET {String(index + 1).padStart(2, "0")}
                </span>

                <div className="ticket-information">

                  <div>
                    <span>
                      PRESIDENT
                    </span>

                    <strong>
                      {ticket.president_id}
                    </strong>
                  </div>

                  <div>
                    <span>
                      DEPUTY
                    </span>

                    <strong>
                      {ticket.deputy_id}
                    </strong>
                  </div>

                </div>

                <span className="ticket-arrow">
                  {selectedTicket?.id === ticket.id
                    ? "✓"
                    : "→"}
                </span>

              </button>
            ))}

          </div>
        )}

        {selectedTicket && (
          <section className="stage2-confirm">

            <p>
              SELECTED TICKET
            </p>

            <strong>
              TICKET{" "}
              {tickets.findIndex(
                (ticket) =>
                  ticket.id === selectedTicket.id
              ) + 1}
            </strong>

            <button
              type="button"
              onClick={castStage2Vote}
              disabled={voting}
              className="stage2-vote-button"
            >
              {voting
                ? "RECORDING VOTE..."
                : "CAST STAGE 2 VOTE →"}
            </button>

          </section>
        )}

        {message && (
          <p className="stage2-message">
            {message}
          </p>
        )}

        {error && (
          <p className="stage2-error">
            {error}
          </p>
        )}

        <p className="stage2-footer">
          YOUR STAGE 2 VOTE CAN ONLY BE CAST ONCE.
        </p>

      </section>
    </main>
  );
}

function Stage2Fallback() {
  return (
    <main className="stage2-page">
      <section className="stage2-container">
        <p>LOADING STAGE 2...</p>
      </section>
    </main>
  );
}

export default function Stage2VotePage() {
  return (
    <Suspense fallback={<Stage2Fallback />}>
      <Stage2VoteContent />
    </Suspense>
  );
          }
