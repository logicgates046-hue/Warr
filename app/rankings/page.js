'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function RankingsPage() {
  const [userId, setUserId] = useState(null);
  const [wantamTicket, setWantamTicket] = useState(null);
  const [tutamTicket, setTutamTicket] = useState(null);
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

      setUserId(authData.user.id);

      const { data: wantamData } = await supabase
        .from('tickets')
        .select(`
          id,
          vote_count,
          president:president_id ( name, photo_url ),
          deputy:deputy_id ( name, photo_url )
        `)
        .eq('side', 'WANTAM')
        .order('vote_count', { ascending: false })
        .limit(1)
        .single();

      const { data: tutamData } = await supabase
        .from('tickets')
        .select(`
          id,
          vote_count,
          president:president_id ( name, photo_url ),
          deputy:deputy_id ( name, photo_url )
        `)
        .eq('side', 'TUTAM')
        .order('vote_count', { ascending: false })
        .limit(1)
        .single();

      setWantamTicket(wantamData);
      setTutamTicket(tutamData);

      const { data: voteData } = await supabase
        .from('rankings_votes')
        .select('side')
        .eq('user_id', authData.user.id)
        .single();

      if (voteData) {
        setExistingVote(voteData.side);
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleVote = async (side) => {
    if (existingVote || voting) return;
    setVoting(true);
    setError('');

    const { error: voteError } = await supabase
      .from('rankings_votes')
      .insert({ user_id: userId, side });

    if (voteError) {
      setError('Something went wrong. Please try again.');
      setVoting(false);
      return;
    }

    await supabase.from('profiles').update({ rankings_vote: side }).eq('id', userId);

    setExistingVote(side);
    setVoting(false);
  };

  if (loading) {
    return (
      <main className="home">
        <p className="loading-text">Loading...</p>
      </main>
    );
  }

  const RankingTicket = ({ ticket, sideKey }) => (
    <div
      className={`ticket-card ${sideKey.toLowerCase()} ranking-ticket ${existingVote && existingVote !== sideKey ? 'dimmed' : ''}`}
      onClick={() => handleVote(sideKey)}
    >
      <span className="side-label">MOST PREFERRED — {sideKey}</span>
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
      {existingVote && (
        <p className="vote-count-reveal">{ticket.vote_count} votes</p>
      )}
      {existingVote === sideKey && <span className="voted-badge">✓ YOUR VOTE</span>}
    </div>
  );

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>
        <h1 className="battle-title">RANKINGS</h1>
        <p className="intro">
          {existingVote
            ? 'Thanks for voting — here are the results so far.'
            : "See each side's most preferred ticket. Vote to reveal the results."}
        </p>

        {wantamTicket && <RankingTicket ticket={wantamTicket} sideKey="WANTAM" />}

        <div className="versus">VS</div>

        {tutamTicket && <RankingTicket ticket={tutamTicket} sideKey="TUTAM" />}

        {error && <p className="auth-error">{error}</p>}

        {existingVote && (
          <a href="/community" className="enter-button">
            CONTINUE TO COMMUNITY
          </a>
        )}
      </section>
    </main>
  );
                    }
