'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function CandidaturePage() {
  const [userId, setUserId] = useState(null);
  const [side, setSide] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [existingVote, setExistingVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        window.location.href = '/login';
        return;
      }

      const { data: profile, error: profileFetchError } = await supabase
        .from('profiles')
        .select('side')
        .eq('id', authData.user.id)
        .single();

      if (profileFetchError) {
        setError(profileFetchError.message);
        setLoading(false);
        return;
      }

      if (!profile?.side) {
        window.location.href = '/battle';
        return;
      }

      setUserId(authData.user.id);
      setSide(profile.side);

      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          id,
          vote_count,
          president:president_id ( name, photo_url ),
          deputy:deputy_id ( name, photo_url )
        `)
        .eq('side', profile.side);

      if (ticketError) {
        setError(ticketError.message);
        setLoading(false);
        return;
      }

      setTickets(ticketData || []);

      const { data: voteData } = await supabase
        .from('candidature_votes')
        .select('ticket_id')
        .eq('user_id', authData.user.id)
        .single();

      if (voteData) {
        setExistingVote(voteData.ticket_id);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleVote = async (ticketId) => {
    if (existingVote || voting) return;
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

    setExistingVote(ticketId);
    setVoting(false);
  };

  const handleShuffle = () => {
    const shuffled = [...tickets].sort(() => Math.random() - 0.5);
    setTickets(shuffled);
  };

  if (loading) {
    return (
      <main className="home">
        <p className="loading-text">Loading...</p>
      </main>
    );
  }

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>

        <div className="title-with-info">
          <h1 className="battle-title">CANDIDATURE</h1>
          <button className="info-icon" onClick={() => setShowInfo(true)}>
            ⓘ
          </button>
        </div>

        <p className="intro">
          {existingVote
            ? `You have selected your preferred ticket for ${side}.`
            : `Choose your preferred presidential ticket for ${side}.`}
        </p>

        {!existingVote && (
          <button onClick={handleShuffle} className="shuffle-button">
            🔀 SHUFFLE TICKETS
          </button>
        )}

        <div className="tickets-list">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`ticket-card ${side.toLowerCase()} ${existingVote && existingVote !== ticket.id ? 'dimmed' : ''}`}
              onClick={() => handleVote(ticket.id)}
            >
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
              {existingVote === ticket.id && <span className="voted-badge">✓ YOUR VOTE</span>}
            </div>
          ))}
        </div>

        {error && <p className="auth-error">{error}</p>}

        {existingVote && (
          <a href="/rankings" className="enter-button">
            CONTINUE TO RANKINGS
          </a>
        )}
      </section>

      {/* INFO MODAL */}
      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInfo(false)}>
              ✕
            </button>
            <h2>Candidature Guide</h2>
            <p>
              You have already chosen your side (<strong>{side}</strong>).
            </p>
            <p>
              Now choose the <strong>presidential ticket</strong> you want to support within your side.
            </p>
            <p>
              Each card shows a President + Deputy President pair.  
              Tap the ticket you prefer.
            </p>
            <p>
              Your vote is final — choose carefully.
            </p>
            <button className="modal-button" onClick={() => setShowInfo(false)}>
              GOT IT
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
                }
