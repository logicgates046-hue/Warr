'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function CandidaturePage() {
  const [userId, setUserId] = useState(null);
  const [side, setSide] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [existingVote, setExistingVote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        window.location.href = '/login';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('side')
        .eq('id', authData.user.id)
        .single();

      if (!profile?.side) {
        window.location.href = '/battle';
        return;
      }

      setUserId(authData.user.id);
      setSide(profile.side);

      const { data: ticketData } = await supabase
        .from('tickets')
        .select(`
          id,
          vote_count,
          president:president_id ( name, photo_url ),
          deputy:deputy_id ( name, photo_url )
        `)
        .eq('side', profile.side);

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
      setError('Something went wrong. Please try again.');
      setVoting(false);
      return;
    }

    await supabase.from('profiles').update({ candidature_ticket_id: ticketId }).eq('id', userId);

    setExistingVote(ticketId);
    setVoting(false);
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
        <h1 className="battle-title">CANDIDATURE</h1>
        <p className="intro">Choose your preferred candidate for {side}.</p>

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
    </main>
  );
        }
