'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const router = useRouter();

  const loadUsers = async () => {
    const { data: userData } = await supabase
      .from('profiles')
      .select('id, ke_war_number, full_name, email, county, side, joined_community, created_at')
      .order('created_at', { ascending: false });

    setUsers(userData || []);
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', authData.user.id).single();

      if (!profile?.is_admin) { router.push('/battle'); return; }

      setIsAdmin(true);
      await loadUsers();
      setLoading(false);
    };
    load();
  }, [router]);

  const handleDelete = async (targetUserId) => {
    setError('');
    setDeletingId(targetUserId);

    const { data: sessionData } = await supabase.auth.getSession();
    const callerAccessToken = sessionData?.session?.access_token;

    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId, callerAccessToken }),
    });

    const result = await res.json();

    if (!res.ok) {
      setError(result.error || 'Failed to delete user.');
      setDeletingId(null);
      return;
    }

    await loadUsers();
    setDeletingId(null);
  };

  if (loading) {
    return <main className="home"><p className="loading-text">Loading...</p></main>;
  }

  if (!isAdmin) return null;

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>
        <h1 className="battle-title">USERS</h1>

        <div className="admin-nav">
          <a href="/admin" className="admin-nav-item">Overview</a>
          <a href="/admin/candidates" className="admin-nav-item">Candidates</a>
          <a href="/admin/tickets" className="admin-nav-item">Tickets</a>
          <a href="/admin/settings" className="admin-nav-item">Settings</a>
          <a href="/admin/users" className="admin-nav-item active">Users</a>
        </div>

        <h2 className="profile-section-title">{users.length} REGISTERED USERS</h2>

        {error && <p className="auth-error">{error}</p>}

        <div className="profile-card">
          {users.map((u) => (
            <div key={u.id} className="profile-row">
              <span className="profile-label">
                {u.ke_war_number} — {u.full_name || 'Unnamed'} ({u.county || 'No county'}) — {u.side || 'No side'}
              </span>
              <button
                onClick={() => handleDelete(u.id)}
                className="admin-delete-button"
                disabled={deletingId === u.id}
              >
                {deletingId === u.id ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
          }
