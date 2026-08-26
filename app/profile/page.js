'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const canvasRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push('/login');
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      setProfile(profileData);

      if (profileData?.candidature_ticket_id) {
        const { data: ticketData } = await supabase
          .from('tickets')
          .select(`president:president_id ( name ), deputy:deputy_id ( name )`)
          .eq('id', profileData.candidature_ticket_id)
          .single();

        setTicket(ticketData);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ========== TIGHT CARD – bigger fonts, less empty space ==========
  const generateShareCard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !profile?.side || !ticket) return null;

    const ctx = canvas.getContext('2d');
    const W = 1200;
    const H = 675;
    canvas.width = W;
    canvas.height = H;

    const isWantam = profile.side === 'WANTAM';
    const accent = isWantam ? '#00e676' : '#ffea00';

    // Full black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // Card (almost fills the canvas)
    const cardX = 30;
    const cardY = 25;
    const cardW = W - 60;
    const cardH = H - 50;
    const radius = 18;

    // Soft glow
    ctx.shadowColor = accent;
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#0d0d0d';
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Card body
    ctx.fillStyle = '#111111';
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    // Neon border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.stroke();

    const left = cardX + 45;
    let y = cardY + 42;

    // KE-WAR
    ctx.fillStyle = '#aaaaaa';
    ctx.font = '700 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('KE-WAR', left, y);

    y += 48;

    // Name
    ctx.fillStyle = '#999999';
    ctx.font = '600 22px Arial';
    ctx.fillText('Name:', left, y);
    y += 34;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 40px Arial';
    ctx.fillText(profile.full_name || 'Kenyan Citizen', left, y);

    y += 52;

    // Position
    ctx.fillStyle = '#999999';
    ctx.font = '600 22px Arial';
    ctx.fillText('Position:', left, y);
    y += 36;
    ctx.fillStyle = accent;
    ctx.font = '800 46px Arial';
    ctx.fillText(profile.side, left, y);

    y += 52;

    // Preferred candidature
    ctx.fillStyle = '#999999';
    ctx.font = '600 22px Arial';
    ctx.fillText('Preferred candidature:', left, y);
    y += 34;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 34px Arial';
    const ticketText = `${ticket.president?.name || '—'} & ${ticket.deputy?.name || '—'}`;
    ctx.fillText(ticketText, left, y);

    y += 52;

    // Ke-war ID
    ctx.fillStyle = '#999999';
    ctx.font = '600 22px Arial';
    ctx.fillText('Ke-war ID:', left, y);
    y += 34;
    ctx.fillStyle = accent;
    ctx.font = '700 30px monospace';
    ctx.fillText(profile.ke_war_number || `ke-war-${profile.id?.slice(0, 8)}`, left, y);

    // war.ke
    ctx.fillStyle = '#777777';
    ctx.font = '600 22px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('war.ke', cardX + cardW - 45, cardY + cardH - 28);

    return canvas.toDataURL('image/png');
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const handleShare = async () => {
    const dataUrl = generateShareCard();
    if (!dataUrl) return;

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], `ke-war-${profile.side?.toLowerCase()}-card.png`, {
      type: 'image/png',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `I'm ${profile.side} on KE-WAR`,
          text: `Name: ${profile.full_name}\nPosition: ${profile.side}\nPreferred candidature: ${ticket?.president?.name} & ${ticket?.deputy?.name}\nKe-war ID: ${profile.ke_war_number}`,
          files: [file],
        });
        return;
      } catch (err) {
        // user cancelled
      }
    }

    // Fallback download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `ke-war-${profile.side?.toLowerCase()}-card.png`;
    link.click();
  };

  if (loading) {
    return (
      <main className="home">
        <p className="loading-text">Loading...</p>
      </main>
    );
  }

  const canShare = profile?.side && ticket;

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>
        <h1 className="battle-title">YOUR PROFILE</h1>

        <div className="profile-card">
          <div className="profile-row">
            <span className="profile-label">KE-WAR NUMBER</span>
            <span className="profile-value highlight">{profile?.ke_war_number || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">FULL NAME</span>
            <span className="profile-value">{profile?.full_name || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">COUNTY</span>
            <span className="profile-value">{profile?.county || '—'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">DATE OF BIRTH</span>
            <span className="profile-value">{profile?.date_of_birth || '—'}</span>
          </div>
        </div>

        <h2 className="profile-section-title">YOUR VOTES</h2>

        <div className="profile-card">
          <div className="profile-row">
            <span className="profile-label">BATTLE SIDE</span>
            <span className={`profile-value ${profile?.side ? 'highlight' : ''}`}>
              {profile?.side || 'Not voted yet'}
            </span>
          </div>
          <div className="profile-row">
            <span className="profile-label">CANDIDATURE TICKET</span>
            <span className="profile-value">
              {ticket ? `${ticket.president?.name} / ${ticket.deputy?.name}` : 'Not voted yet'}
            </span>
          </div>
          <div className="profile-row">
            <span className="profile-label">RANKINGS VOTE</span>
            <span className="profile-value">{profile?.rankings_vote || 'Not voted yet'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">COMMUNITY GROUP</span>
            <span className="profile-value">
              {profile?.joined_community ? 'Joined' : 'Not joined yet'}
            </span>
          </div>
        </div>

        {canShare && (
          <button
            className="share-button"
            onClick={handleShare}
            style={{ marginTop: 24, marginBottom: 16 }}
          >
            SHARE YOUR KE-WAR CARD
          </button>
        )}

        {!canShare && (
          <p
            style={{
              color: '#666',
              fontSize: 14,
              marginTop: 20,
              textAlign: 'center',
            }}
          >
            Vote in Battle + Candidature to unlock your shareable KE-WAR card
          </p>
        )}

        <button onClick={handleLogout} className="logout-button">
          LOGOUT
        </button>
      </section>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      <BottomNav />
    </main>
  );
              }
