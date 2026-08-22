'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminUsersPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, ke_war_number, full_name, email, county, side, is_admin, joined_community, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
      return;
    }

    setUsers(data || []);
    setFilteredUsers(data || []);
  };

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single();

      if (!profile?.is_admin) {
        router.push('/battle');
        return;
      }

      setIsAdmin(true);
      await loadUsers();
      setLoading(false);
    };

    load();
  }, [router]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredUsers(users);
      return;
    }

    const term = search.toLowerCase();
    const filtered = users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.ke_war_number?.toString().includes(term) ||
        u.county?.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const toggleAdmin = async (userId, currentStatus) => {
    if (!confirm(currentStatus ? 'Remove admin rights from this user?' : 'Make this user an Admin?')) {
      return;
    }

    setActionLoading(userId);
    setError('');

    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentStatus })
      .eq('id', userId);

    setActionLoading(null);

    if (error) {
      setError(error.message);
      return;
    }

    await loadUsers();
  };

  const deleteUser = async (userId, userName) => {
    const confirmDelete = confirm(
      `Are you sure you want to DELETE "${userName || 'this user'}"?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    setActionLoading(userId);
    setError('');

    // Delete from profiles table
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    setActionLoading(null);

    if (error) {
      setError(error.message);
      return;
    }

    await loadUsers();
  };

  if (loading) {
    return (
      <main className="home">
        <p className="loading-text">Loading users...</p>
      </main>
    );
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

        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by name, email, county or KE-WAR number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #333',
              background: '#161616',
              color: 'white',
              fontSize: '14px',
            }}
          />
        </div>

        <h2 className="profile-section-title">
          {filteredUsers.length} USER{filteredUsers.length !== 1 ? 'S' : ''}
        </h2>

        {error && <p className="auth-error">{error}</p>}

        <div className="profile-card">
          {filteredUsers.length === 0 ? (
            <p style={{ color: '#9a9a9a', padding: '12px' }}>No users found.</p>
          ) : (
            filteredUsers.map((u) => (
              <div
                key={u.id}
                className="profile-row"
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: '8px',
                  padding: '16px 0',
                  borderBottom: '1px solid #333',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: '15px' }}>{u.full_name || 'Unnamed'}</strong>
                    {u.is_admin && (
                      <span
                        style={{
                          marginLeft: '8px',
                          background: '#ffd500',
                          color: '#000',
                          fontSize: '11px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '700',
                        }}
                      >
                        ADMIN
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleAdmin(u.id, u.is_admin)}
                      disabled={actionLoading === u.id}
                      style={{
                        background: u.is_admin ? '#333' : '#007a3d',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {actionLoading === u.id ? '...' : u.is_admin ? 'Remove Admin' : 'Make Admin'}
                    </button>

                    <button
                      onClick={() => deleteUser(u.id, u.full_name)}
                      disabled={actionLoading === u.id}
                      style={{
                        background: '#bb0000',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      {actionLoading === u.id ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#9a9a9a' }}>{u.email}</div>
                <div style={{ fontSize: '13px', color: '#9a9a9a' }}>
                  KE-WAR #{u.ke_war_number || '—'} • {u.county || 'No county'} • {u.side || 'No side'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Joined: {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
          }
