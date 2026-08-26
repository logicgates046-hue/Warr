'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function CandidaturePage() {
  const [userId, setUserId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [keWarId, setKeWarId] = useState('');
  const [side, setSide] = useState(null);
  const [wantamTickets, setWantamTickets] = useState([]);
  const [tutamTickets, setTutamTickets] = useState([]);
  const [wantamIndex, setWantamIndex] = useState(0);
  const [tutamIndex, setTutamIndex] = useState(0);
  const [sideTickets, setSideTickets] = useState([]);
  const [ticketIndex, setTicketIndex] = useState(0);
  const [existingVote, setExistingVote] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const canvasRef = useRef(null);

  const refreshTickets = async () => {
    const [{ data: wantamData }, { data: tutamData }] = await Promise.all([
      supabase
        .from('tickets')
        .select(`id, vote_count, president:president_id ( name, photo_url ), deputy:deputy_id ( name, photo_url )`)
        .eq('side', 'WANTAM'),
      supabase
        .from('tickets')
        .select(`id, vote_count, president:president_id ( name, photo_url ), deputy:deputy_id ( name, photo_url )`)
        .eq('side', 'TUTAM'),
    ]);

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

      const [{ data: profile }, ticketResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('side, candidature_ticket_id, full_name, ke_war_number')
          .eq('id', authData.user.id)
          .single(),
        refreshTickets(),
      ]);

      const userSide = profile?.side || null;
      setSide(userSide);
      setFullName(profile?.full_name || 'Kenyan Citizen');
      setKeWarId(profile?.ke_war_number || `ke-war-${authData.user.id.slice(0, 8)}`);

      const { wantamData, tutamData } = ticketResult;

      if (userSide) {
        const tickets = userSide === 'WANTAM' ? (wantamData || []) : (tutamData || []);
        setSideTickets(tickets);

        if (profile?.candidature_ticket_id) {
          setExistingVote(profile.candidature_ticket_id);
          const found = tickets.find((t) => t.id === profile.candidature_ticket_id);
          if (found) setSelectedTicket(found);
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

    const { wantamData, tutamData } = await refreshTickets();
    const tickets = side === 'WANTAM' ? (wantamData || []) : (tutamData || []);
    setSideTickets(tickets);

    const found = tickets.find((t) => t.id === ticketId);
    setSelectedTicket(found || null);
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

  // ========== LANDSCAPE CARD WITH EDGES ==========
  const generateShareCard = () => {
    const canvas = canvasRef.current;
    if (!canvas || !side || !selectedTicket) return null;

    const ctx = canvas.getContext('2d');
    const W = 1200; // landscape width
    const H = 675;  // landscape height
    canvas.width = W;
    canvas.height = H;

    const isWantam = side === 'WANTAM';
    const accent = isWantam ? '#00e676' : '#ffea00';
    const accentSoft = isWantam ? 'rgba(0, 230, 118, 0.35)' : 'rgba(255, 234, 0, 0.35)';

    // Full black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // Card dimensions (with margins so it looks like a floating card)
    const cardX = 60;
    const cardY = 40;
    const cardW = W - 120;
    const cardH = H - 80;
    const radius = 24;

    // Soft glow behind card
    ctx.shadowColor = accent;
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#0d0d0d';
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Card body
    ctx.fillStyle = '#111111';
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.fill();

    // Neon border
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    roundRect(ctx, cardX, cardY, cardW, cardH, radius);
    ctx.stroke();

    // Inner content
    const left = cardX + 50;
    let y = cardY + 55;

    // KE-WAR
    ctx.fillStyle = '#888888';
    ctx.font = '600 22px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('KE-WAR', left, y);

    y += 55;

    // Name
    ctx.fillStyle = '#777777';
    ctx.font = '500 18px Arial';
    ctx.fillText('Name:', left, y);
    y += 32;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 28px Arial';
    ctx.fillText(fullName || 'Kenyan Citizen', left, y);

    y += 50;

    // Position
    ctx.fillStyle = '#777777';
    ctx.font = '500 18px Arial';
    ctx.fillText('Position:', left, y);
    y += 32;
    ctx.fillStyle = accent;
    ctx.font = '700 32px Arial';
    ctx.fillText(side, left, y);

    y += 50;

    // Preferred candidature
    ctx.fillStyle = '#777777';
    ctx.font = '500 18px Arial';
    ctx.fillText('Preferred candidature:', left, y);
    y += 32;
    ctx.fillStyle = '#ffffff';
    ctx.font = '600 26px Arial';
    const ticketText = `${selectedTicket.president?.name || '—'} & ${selectedTicket.deputy?.name || '—'}`;
    ctx.fillText(ticketText, left, y);

    y += 50;

    // Ke-war ID
    ctx.fillStyle = '#777777';
    ctx.font = '500 18px Arial';
    ctx.fillText('Ke-war ID:', left, y);
    y += 32;
    ctx.fillStyle = accent;
    ctx.font = '600 22px monospace';
    ctx.fillText(keWarId, left, y);

    // war.ke at bottom of card
    ctx.fillStyle = '#555555';
    ctx.font = '500 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('war.ke', cardX + cardW - 50, cardY + cardH - 30);

    return canvas.toDataURL('image/png');
  };

  // Helper: rounded rectangle
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
    const file = new File([blob], `ke-war-${side?.toLowerCase()}-card.png`, {
      type: 'image/png',
    });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: `I'm ${side} on KE-WAR`,
          text: `Name: ${fullName}\nPosition: ${side}\nPreferred candidature: ${selectedTicket?.president?.name} & ${selectedTicket?.deputy?.name}\nKe-war ID: ${keWarId}`,
          files: [file],
        });
        return;
      } catch (err) {
        // user cancelled
      }
    }

    // Fallback: download
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `ke-war-${side?.toLowerCase()}-card.png`;
    link.click();
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

        {/* AFTER VOTING – SHARE CARD */}
        {existingVote && selectedTicket ? (
          <div className="share-moment">
            <p className="share-label">YOUR POSITION IS LOCKED</p>
            <h2 className={`share-side ${side?.toLowerCase()}`}>
              {side} {side === 'WANTAM' ? '🟢' : '🟡'}
            </h2>

            <div className="share-ticket-preview">
              <p className="share-ticket-label">YOUR TICKET</p>
              <p className="share-ticket-names">
                {selectedTicket.president?.name} <span>&</span> {selectedTicket.deputy?.name}
              </p>
            </div>

            <button className="share-button" onClick={handleShare}>
              SHARE YOUR KE-WAR CARD
            </button>

            <p className="share-hint">
              Creates a premium landscape card for WhatsApp, Instagram, TikTok & X
            </p>

            <a href="/rankings" className="enter-button" style={{ marginTop: 28 }}>
              CONTINUE TO RANKINGS
            </a>
          </div>
        ) : !side ? (
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
              Choose your preferred presidential ticket for {side}.
            </p>

            {sideTickets[ticketIndex] && (
              <TicketCard
                ticket={sideTickets[ticketIndex]}
                sideKey={side}
                locked={!!existingVote}
                onVote={handleVote}
              />
            )}

            <button onClick={shuffleSideTicket} className="shuffle-button">
              SHUFFLE TICKET
            </button>
          </>
        )}

        {error && <p className="auth-error">{error}</p>}
      </section>

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {showInfo && (
        <div className="modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowInfo(false)}>×</button>
            <h2>Candidature Guide</h2>
            <p>Each card shows one President + Deputy President ticket at a time.</p>
            <p>Tap Shuffle to browse other tickets.</p>
            <p>You must vote in Battle first before you can vote here.</p>
            <button className="modal-button" onClick={() => setShowInfo(false)}>GOT IT</button>
          </div>
        </div>
      )}

      <BottomNav />
    </main>
  );
      }
