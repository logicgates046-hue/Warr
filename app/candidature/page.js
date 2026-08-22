'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function CandidaturePage() {
  const [userId, setUserId] = useState(null);
  const [side, setSide] = useState(null);
  const [wantamTickets, setWantamTickets] = useState([]);
  const [tutamTickets, setTutamTickets] = useState([]);
  const [wantamIndex, setWantamIndex] = useState(0);
  const [tutamIndex, setTutamIndex] = useState(0);
  const [sideTickets, setSideTickets] = useState([]);
  const [ticketIndex, setTicketIndex] = useState(0);
  const [existingVote, setExistingVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const refreshTickets = async () => {
    const { data: wantamData } = await supabase
      .from('tickets')
      .select(`id, vote_count, president:president_id ( name, photo_url ), deputy:deputy_id ( name, photo_url )`)
      .eq('side', 'WANTAM');

    const { data: tutamData } = await supabase
      .from('tickets')
      .select(`id, vote_count, president:president_id ( name, photo_url ), deputy:deputy_id ( name, photo_url )`)
      .eq('side', 'TUTAM');

    setWantamTickets(wantamData || []);
    setTutamTickets(tutamData || []);
    return { wantamData, tutamData };
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        window.location.href = '/login';
        return;
      }

      setUserId(authData.user.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('side')
        .eq('id', authData.user.id)
        .single();

      const userSide = profile?.side || null;
      setSide(userSide);

      const { wantamData, tutamData } = await refreshTickets();

      if (userSide) {
        setSideTickets(userSide === 'WANTAM' ? (wantamData || []) : (tutamData || []));

        const { data: voteData } = await supabase
          .from('candidature_votes')
          .select('ticket_id')
          .eq('user_id', authData.user.id)
          .single();

        if (voteData) {
          setExistingVote(voteData.ticket_id);
        }
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleVote = async (ticketId) => {
    if (!side || existingVote || voting) return;
    setVoting(true);
    setError('');

    const { error: voteError } = await supabase
      .from('candidature_votes')
      .insert({ user_id: userId, ticket_id: ticketId });

    if (voteError) {
      setError(voteError.message);
      setVoting(false);
      return;
    }

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({ candidature_ticket_id: ticketId })
      .eq('id', userId);

    if (profileUpdateError) {
      setError(profileUpdateError.message);
      setVoting(false);
      return;
    }

    // Refresh tickets so the new vote count shows immediately
    const { wantamData, tutamData } = await refreshTickets();
    if (side) {
      setSideTickets(side === 'WANTAM' ? (wantamData || []) : (tutamData || []));
    }

    setExistingVote(ticketId);
    setVoting(false);
  };

  const shuffleWantam = () => {
    if (wantamTickets.length < 2) return;
    setWantamIndex((prev) => (prev + 1) % wantamTickets.length);
  };

  const shuffleTutam = () => {
    if (tutamTickets.length < 2) return;
    setTutamIndex((prev) => (prev + 1) % tutamTickets.length);
  };

  const shuffleSideTicket = () => {
    if (sideTickets.length < 2) return;
    setTicketIndex((prev) => (prev + 1) % sideTickets.length);
  };

  if (loading) {
    return (
      <main className="home">
        <p className="loading-text">Loading...</p>
      </main>
    );
  }

  const TicketCard = ({ ticket, sideKey, locked, onVote }) => (
    <div className={`ticket-card ${sideKey.toLowerCase()} ${locked ? 'locked' : ''}`}>
      <span className="side-label">{sideKey}</span>
      <div className="ticket-people">
        <div className="ticket-person">
          <img src={ticket.president.photo_url} alt={ticket.president.name} />
          <div>
            <span className="ticket-role">PRESIDENT</span>
            <span className="ticket-name">{ticket.president.name}</span>
          </div>
        </div>
        <div className="ticket-person">
          <img src={ticket.deputy.photo_url} alt={ticket.deputy.name} />
          <div>
            <span className="ticket-role">DEPUTY PRESIDENT</span>
            <span className="ticket-name">{ticket.deputy.name}</span>
          </div>
        </div>
      </div>
      <p className="vote-count-reveal">{ticket.vote_count} votes</p>
      {onVote && (
        <button
          className="vote-ticket-button"
          disabled={locked || voting}
          onClick={() => onVote(ticket.id)}
        >
          {locked ? 'VOTE IN BATTLE FIRST' : 'VOTE FOR THIS TICKET'}
        </button>
      )}
    </div>
  );

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>

        <div className="title-with-info">
          <h1 className="battle-title">CANDIDATURE</h1>
          <button className="info-icon" onClick={() => setShowInfo(true)}>i</button>
        </div>

        {!side ? (
          <>
            <p className="intro">
              You haven't voted in Battle yet. Browse both sides' tickets below —
              vote in Battle to unlock voting here.
            </p>

            {wantamTickets[wantamIndex] && (
              <>
                <TicketCard ticket={wantamTickets[wantamIndex]} sideKey="WANTAM" locked onVote={handleVote} />
                <button onClick={shuffleWantam} className="shuffle-button">SHUFFLE WANTAM</button>
              </>
            )}

            <div className="versus">VS</div>

            {tutamTickets[tutamIndex] && (
              <>
                <TicketCard ticket={tutamTickets[tutamIndex]} sideKey="TUTAM" locked onVote={handleVote} />
                <button onClick={shuffleTutam} className="shuffle-button">SHUFFLE TUTAM</button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="intro">
              {existingVote
                ? `You have selected your preferred ticket for ${side}. Feel free to keep browsing.`
                : `Choose your preferred presidential ticket for ${side}.`}
            </p>

            {sideTickets[ticketIndex] && (
              <TicketCard
                ticket={sideTickets[ticketIndex]}
                sideKey={side}
                locked={!!existingVote}
                onVote={handleVote}
              />
            )}

            <button onClick={shuffleSideTicket} className="shuffle-button">SHUFFLE TICKET</button>

            {existingVote && (
              <a href="/rankings" className="enter-button">CONTINUE TO RANKINGS</a>
            )}
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
      </section>

      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInfo(false)}>×</button>
            <h2>Candidature Guide</h2>
            <p>Each card shows one President + Deputy President ticket at a time, along with how many votes it has.</p>
            <p>Tap Shuffle to browse other tickets — anytime, even after voting.</p>
            <p>You must vote in Battle first before you can vote here.</p>
            <button className="modal-button" onClick={() => setShowInfo(false)}>GOT IT</button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
              }
