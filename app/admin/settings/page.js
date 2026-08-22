'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminSettingsPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [wantamLink, setWantamLink] = useState('');
  const [tutamLink, setTutamLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', authData.user.id).single();

      if (!profile?.is_admin) { router.push('/battle'); return; }

      setIsAdmin(true);

      const { data: settings } = await supabase.from('settings').select('*');
      const wantam = settings?.find((s) => s.key === 'whatsapp_wantam');
      const tutam = settings?.find((s) => s.key === 'whatsapp_tutam');

      setWantamLink(wantam?.value || '');
      setTutamLink(tutam?.value || '');
      setLoading(false);
    };
    load();
  }, [router]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    setSaved(false);

    const { error: e1 } = await supabase.from('settings').update({ value: wantamLink }).eq('key', 'whatsapp_wantam');
    const { error: e2 } = await supabase.from('settings').update({ value: tutamLink }).eq('key', 'whatsapp_tutam');

    setSaving(false);

    if (e1 || e2) {
      setError((e1 || e2).message);
      return;
    }

    setSaved(true);
  };

  if (loading) {
    return <main className="home"><p className="loading-text">Loading...</p></main>;
  }

  if (!isAdmin) return null;

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>
        <h1 className="battle-title">SETTINGS</h1>

        <div className="admin-nav">
          <a href="/admin" className="admin-nav-item">Overview</a>
          <a href="/admin/candidates" className="admin-nav-item">Candidates</a>
          <a href="/admin/tickets" className="admin-nav-item">Tickets</a>
          <a href="/admin/settings" className="admin-nav-item active">Settings</a>
          <a href="/admin/users" className="admin-nav-item">Users</a>
        </div>

        <h2 className="profile-section-title">WHATSAPP LINKS</h2>
        <form onSubmit={handleSave} className="auth-form">
          <label>WANTAM GROUP LINK</label>
          <input type="text" value={wantamLink} onChange={(e) => setWantamLink(e.target.value)} />

          <label>TUTAM GROUP LINK</label>
          <input type="text" value={tutamLink} onChange={(e) => setTutamLink(e.target.value)} />

          {error && <p className="auth-error">{error}</p>}
          {saved && <p className="profile-value highlight">Saved successfully.</p>}

          <button type="submit" className="auth-button" disabled={saving}>
            {saving ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
        </form>
      </section>
    </main>
  );
          }
