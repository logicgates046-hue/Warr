'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function CommunityPage() {
  const [userId, setUserId] = useState(null);
  const [side, setSide] = useState(null);
  const [joined, setJoined] = useState(false);
  const [links, setLinks] = useState({ WANTAM: '', TUTAM: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      const { data: settings } = await supabase.from('settings').select('*');
      const wantam = settings?.find((s) => s.key === 'whatsapp_wantam');
      const tutam = settings?.find((s) => s.key === 'whatsapp_tutam');

      setLinks({
        WANTAM: wantam?.value || '',
        TUTAM: tutam?.value || '',
      });

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
    window.open(links[side], '_blank');
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
        <h1 className="battle-title">COMMUNITY</h1>

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

      <BottomNav />
    </main>
  );
}
