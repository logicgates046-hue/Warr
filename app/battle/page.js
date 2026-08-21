'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function BattlePage() {
  const [userId, setUserId] = useState(null);
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

      const { data: voteData } = await supabase
        .from('battle_votes')
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
      .from('battle_votes')
      .insert({ user_id: userId, side });

    if (voteError) {
      setError(voteError.message);
      setVoting(false);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').update({ side }).eq('id', userId);

    if (profileError) {
      setError(profileError.message);
      setVoting(false);
      return;
    }

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

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>
        <h1 className="battle-title">
          {existingVote ? "YOU'VE CAST YOUR VOTE" : 'WHICH ARE YOU IN?'}
        </h1>
        <p className="intro">
          {existingVote
            ? `You're standing with ${existingVote}. Continue to see your side's candidates.`
            : 'Pick your side. This vote is final.'}
        </p>

        <div className="battle">
          <div
            className={`side wantam ${existingVote && existingVote !== 'WANTAM' ? 'dimmed' : ''}`}
            onClick={() => handleVote('WANTAM')}
          >
            <span className="side-label">WANTAM</span>
            <h2>ONE TERM</h2>
            <p>Do you support the current President serving only one presidential term?</p>
            {existingVote === 'WANTAM' && <span className="voted-badge">✓ YOUR VOTE</span>}
          </div>

          <div className="versus">VS</div>

          <div
            className={`side tutam ${existingVote && existingVote !== 'TUTAM' ? 'dimmed' : ''}`}
            onClick={() => handleVote('TUTAM')}
          >
            <span className="side-label">TUTAM</span>
            <h2>SECOND TERM</h2>
            <p>Do you support the current President seeking a second presidential term?</p>
            {existingVote === 'TUTAM' && <span className="voted-badge">✓ YOUR VOTE</span>}
          </div>
        </div>

        {error && <p className="auth-error">{error}</p>}

        {existingVote && (
          <a href="/candidature" className="enter-button">
            CONTINUE TO CANDIDATURE
          </a>
        )}
      </section>

      <BottomNav />
    </main>
  );
        }
