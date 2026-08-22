'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminCandidatesPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [side, setSide] = useState('WANTAM');
  const [photoUrl, setPhotoUrl] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const loadCandidates = async () => {
    const { data } = await supabase.from('candidates').select('*').order('side').order('name');
    setCandidates(data || []);
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', authData.user.id).single();

      if (!profile?.is_admin) { router.push('/battle'); return; }

      setIsAdmin(true);
      await loadCandidates();
      setLoading(false);
    };
    load();
  }, [router]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');

    const { error: insertError } = await supabase
      .from('candidates')
      .insert({ name, side, photo_url: photoUrl });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setName('');
    setPhotoUrl('');
    await loadCandidates();
  };

  const handleDelete = async (id) => {
    const { error: deleteError } = await supabase.from('candidates').delete().eq('id', id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    await loadCandidates();
  };

  if (loading) {
    return <main className="home"><p className="loading-text">Loading...</p></main>;
  }

  if (!isAdmin) return null;

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>
        <h1 className="battle-title">CANDIDATES</h1>

        <div className="admin-nav">
          <a href="/admin" className="admin-nav-item">Overview</a>
          <a href="/admin/candidates" className="admin-nav-item active">Candidates</a>
          <a href="/admin/tickets" className="admin-nav-item">Tickets</a>
          <a href="/admin/settings" className="admin-nav-item">Settings</a>
          <a href="/admin/users" className="admin-nav-item">Users</a>
        </div>

        <h2 className="profile-section-title">ADD CANDIDATE</h2>
        <form onSubmit={handleAdd} className="auth-form">
          <label>NAME</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />

          <label>SIDE</label>
          <select value={side} onChange={(e) => setSide(e.target.value)}>
            <option value="WANTAM">WANTAM</option>
            <option value="TUTAM">TUTAM</option>
          </select>

          <label>PHOTO URL</label>
          <input type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://..." />

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button">ADD CANDIDATE</button>
        </form>

        <h2 className="profile-section-title">ALL CANDIDATES</h2>
        <div className="profile-card">
          {candidates.map((c) => (
            <div key={c.id} className="profile-row">
              <span className="profile-label">{c.side} — {c.name}</span>
              <button onClick={() => handleDelete(c.id)} className="admin-delete-button">DELETE</button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
