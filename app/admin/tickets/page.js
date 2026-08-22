'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminTicketsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [side, setSide] = useState('WANTAM');
  const [presidentId, setPresidentId] = useState('');
  const [deputyId, setDeputyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadData = async () => {
    const { data: ticketData } = await supabase
      .from('tickets')
      .select(`id, side, vote_count, president:president_id ( name ), deputy:deputy_id ( name )`)
      .order('side');
    setTickets(ticketData || []);

    const { data: candidateData } = await supabase.from('candidates').select('*').order('side').order('name');
    setCandidates(candidateData || []);
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', authData.user.id).single();

      if (!profile?.is_admin) { router.push('/battle'); return; }

      setIsAdmin(true);
      await loadData();
      setLoading(false);
    };
    load();
  }, [router]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    if (!presidentId || !deputyId) {
      setError('Select both a President and a Deputy.');
      return;
    }

    const { error: insertError } = await supabase
      .from('tickets')
      .insert({ side, president_id: presidentId, deputy_id: deputyId });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setPresidentId('');
    setDeputyId('');
    await loadData();
  };

  const handleDelete = async (id) => {
    const { error: deleteError } = await supabase.from('tickets').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadData();
  };

  const sideCandidates = candidates.filter((c) => c.side === side);

  if (loading) {
    return <main className="home"><p className="loading-text">Loading...</p></main>;
  }

  if (!isAdmin) return null;

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>
        <h1 className="battle-title">TICKETS</h1>

        <div className="admin-nav">
          <a href="/admin" className="admin-nav-item">Overview</a>
          <a href="/admin/candidates" className="admin-nav-item">Candidates</a>
          <a href="/admin/tickets" className="admin-nav-item active">Tickets</a>
          <a href="/admin/settings" className="admin-nav-item">Settings</a>
          <a href="/admin/users" className="admin-nav-item">Users</a>
        </div>

        <h2 className="profile-section-title">ADD TICKET</h2>
        <form onSubmit={handleAdd} className="auth-form">
          <label>SIDE</label>
          <select value={side} onChange={(e) => { setSide(e.target.value); setPresidentId(''); setDeputyId(''); }}>
            <option value="WANTAM">WANTAM</option>
            <option value="TUTAM">TUTAM</option>
          </select>

          <label>PRESIDENT</label>
          <select value={presidentId} onChange={(e) => setPresidentId(e.target.value)}>
            <option value="" disabled>Select president</option>
            {sideCandidates.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label>DEPUTY PRESIDENT</label>
          <select value={deputyId} onChange={(e) => setDeputyId(e.target.value)}>
            <option value="" disabled>Select deputy</option>
            {sideCandidates.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button">ADD TICKET</button>
        </form>

        <h2 className="profile-section-title">ALL TICKETS</h2>
        <div className="profile-card">
          {tickets.map((t) => (
            <div key={t.id} className="profile-row">
              <span className="profile-label">
                {t.side} — {t.president?.name} / {t.deputy?.name} ({t.vote_count} votes)
              </span>
              <button onClick={() => handleDelete(t.id)} className="admin-delete-button">DELETE</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
