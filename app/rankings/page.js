'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function RankingsPage() {
  const [userId, setUserId] = useState(null);
  const [hasCandidatureVote, setHasCandidatureVote] = useState(false);
  const [wantamTicket, setWantamTicket] = useState(null);
  const [tutamTicket, setTutamTicket] = useState(null);
  const [existingVote, setExistingVote] = useState(null);
  const [wantamRankVotes, setWantamRankVotes] = useState(0);
  const [tutamRankVotes, setTutamRankVotes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

  const loadRankCounts = async () => {
    const [{ count: wantamCount }, { count: tutamCount }] = await Promise.all([
      supabase
        .from('rankings_votes')
        .select('*', { count: 'exact', head: true })
        .eq('side', 'WANTAM'),
      supabase
        .from('rankings_votes')
        .select('*', { count: 'exact', head: true })
        .eq('side', 'TUTAM'),
    ]);

    setWantamRankVotes(wantamCount || 0);
    setTutamRankVotes(tutamCount || 0);
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        window.location.href = '/login';
        return;
      }

      setUserId(authData.user.id);

      const [
        { data: candVote },
        { data: wantamData },
        { data: tutamData },
        { data: rankVote },
      ] = await Promise.all([
        supabase
          .from('candidature_votes')
          .select('ticket_id')
          .eq('user_id', authData.user.id)
          .single(),
        supabase
          .from('tickets')
          .select(`id, president:president_id ( name, photo_url ), deputy:deputy_id ( name, photo_url )`)
          .eq('side', 'WANTAM')
          .order('vote_count', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('tickets')
          .select(`id, president:president_id ( name, photo_url ), deputy:deputy_id ( name, photo_url )`)
          .eq('side', 'TUTAM')
          .order('vote_count', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('rankings_votes')
          .select('side')
          .eq('user_id', authData.user.id)
          .single(),
      ]);

      setHasCandidatureVote(!!candVote);
      setWantamTicket(wantamData);
      setTutamTicket(tutamData);

      if (rankVote) {
        setExistingVote(rankVote.side);
        await loadRankCounts();
      }

      setLoading(false);
    };

    load();
  }, []);

  const handleVote = async (side) => {
    if (!hasCandidatureVote || existingVote || voting) return;
    setVoting(true);
    setError('');

    const { error: voteError } = await supabase
      .from('rankings_votes')
      .insert({ user_id: userId, side });

    if (voteError) {
      setError(voteError.message);
      setVoting(false);
      return;
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ rankings_vote: side })
      .eq('id', userId);

    if (profileError) {
      setError(profileError.message);
      setVoting(false);
      return;
    }

    setExistingVote(side);
    await loadRankCounts();
    setVoting(false);
  };

  if (loading) {
    return (
      <main className="home">
        <p className="loading-text">Loading...</p>
      </main>
    );
  }

  const locked = !hasCandidatureVote;

  const RankingTicket = ({ ticket, sideKey, rankVotes }) => (
    <div className={`ticket-card ${sideKey.toLowerCase()} ${locked ? 'locked' : ''}`}>
      <span className="side-label">MOST CHOSEN — {sideKey}</span>
      <div className="ticket-people">
        <div className="ticket-person">
          <img
            src={ticket.president?.photo_url || '/placeholder-avatar.png'}
            alt={ticket.president?.name || 'President'}
            loading="lazy"
            decoding="async"
            width={80}
            height={80}
          />
          <div>
            <span className="ticket-role">PRESIDENT</span>
            <span className="ticket-name">{ticket.president?.name}</span>
          </div>
        </div>
        <div className="ticket-person">
          <img
            src={ticket.deputy?.photo_url || '/placeholder-avatar.png'}
            alt={ticket.deputy?.name || 'Deputy'}
            loading="lazy"
            decoding="async"
            width={80}
            height={80}
          />
          <div>
            <span className="ticket-role">DEPUTY PRESIDENT</span>
            <span className="ticket-name">{ticket.deputy?.name}</span>
          </div>
        </div>
      </div>

      {/* Only show Rankings votes (H2H), never candidature ticket votes */}
      {existingVote && (
        <p className="vote-count-reveal">{rankVotes} rankings votes</p>
      )}

      <button
        className="vote-ticket-button"
        disabled={locked || !!existingVote || voting}
        onClick={() => handleVote(sideKey)}
      >
        {locked
          ? 'VOTE IN CANDIDATURE FIRST'
          : existingVote === sideKey
          ? 'YOUR VOTE'
          : existingVote
          ? 'VOTED'
          : 'VOTE FOR THIS SIDE'}
      </button>
    </div>
  );

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>

        <div className="title-with-info">
          <h1 className="battle-title">RANKINGS</h1>
          <button className="info-icon" onClick={() => setShowInfo(true)}>i</button>
        </div>

        <p className="intro">
          {locked
            ? "Vote in Candidature to unlock voting here. You can still see each side's most chosen ticket below."
            : existingVote
            ? 'Thanks for voting — here is the head-to-head so far.'
            : "See each side's most chosen ticket, then cast your Rankings vote to reveal the numbers."}
        </p>

        {wantamTicket && (
          <RankingTicket
            ticket={wantamTicket}
            sideKey="WANTAM"
            rankVotes={wantamRankVotes}
          />
        )}

        <div className="versus">VS</div>

        {tutamTicket && (
          <RankingTicket
            ticket={tutamTicket}
            sideKey="TUTAM"
            rankVotes={tutamRankVotes}
          />
        )}

        {error && <p className="auth-error">{error}</p>}

        {existingVote && (
          <a href="/community" className="enter-button">
            CONTINUE TO COMMUNITY
          </a>
        )}
      </section>

      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInfo(false)}>
              ×
            </button>
            <h2>Rankings Guide</h2>
            <p>These are the most chosen tickets so far for WANTAM and TUTAM from Candidature.</p>
            <p>You vote here for the side you want to win the head-to-head.</p>
            <p>The numbers that appear after you vote are Rankings votes (WANTAM vs TUTAM), not the ticket votes.</p>
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
