'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

const WHATSAPP_LINKS = {
  WANTAM: 'https://chat.whatsapp.com/KgFPeGjFM4OJYbmWlWHrFU?s=cl&p=a&ilr=4',
  TUTAM: 'https://chat.whatsapp.com/I7Fz4EbL2s0Cbfs5vPBMp4?s=cl&p=a&ilr=4',
};

export default function CommunityPage() {
  const [userId, setUserId] = useState(null);
  const [side, setSide] = useState(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);

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
        .select('side, joined_community')
        .eq('id', authData.user.id)
        .single();

      setSide(profile?.side || null);
      setJoined(!!profile?.joined_community);
      setLoading(false);
    };

    load();
  }, []);

  const handleJoin = async () => {
    if (!side) return;
    setError('');

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ joined_community: true, joined_community_at: new Date().toISOString() })
      .eq('id', userId);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setJoined(true);
    window.open(WHATSAPP_LINKS[side], '_blank');
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
          <h1 className="battle-title">COMMUNITY</h1>
          <button className="info-icon" onClick={() => setShowInfo(true)}>i</button>
        </div>

        {!side ? (
          <p className="intro">
            You need to vote in Battle first before you can join a community group.
          </p>
        ) : (
          <>
            <p className="intro">
              {joined
                ? `You've joined the ${side} community group.`
                : `Join fellow ${side} supporters in the official WhatsApp group.`}
            </p>

            <div className={`side ${side.toLowerCase()}`}>
              <span className="side-label">{side}</span>
              <h2>{side === 'WANTAM' ? 'ONE TERM COMMUNITY' : 'SECOND TERM COMMUNITY'}</h2>
              <p>Connect with other Kenyans who stand with {side}.</p>
            </div>

            {error && <p className="auth-error">{error}</p>}

            <button onClick={handleJoin} className="enter-button">
              {joined ? 'OPEN WHATSAPP GROUP AGAIN' : 'JOIN WHATSAPP GROUP'}
            </button>
          </>
        )}
      </section>

      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInfo(false)}>×</button>
            <h2>Community Guide</h2>
            <p>Once you vote in Battle, you unlock access to your side's official WhatsApp community.</p>
            <p>Tap the join button to connect with other KE-WAR members who share your side.</p>
            <button className="modal-button" onClick={() => setShowInfo(false)}>GOT IT</button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
                                                   }
