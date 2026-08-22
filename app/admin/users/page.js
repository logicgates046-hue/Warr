'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', authData.user.id).single();

      if (!profile?.is_admin) { router.push('/battle'); return; }

      setIsAdmin(true);

      const { data: userData } = await supabase
        .from('profiles')
        .select('ke_war_number, full_name, email, county, side, joined_community, created_at')
        .order('created_at', { ascending: false });

      setUsers(userData || []);
      setLoading(false);
    };
    load();
  }, [router]);

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
        <div className="profile-card">
          {users.map((u) => (
            <div key={u.ke_war_number} className="profile-row">
              <span className="profile-label">
                {u.ke_war_number} — {u.full_name || 'Unnamed'} ({u.county || 'No county'})
              </span>
              <span className="profile-value">{u.side || '—'}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
    }
