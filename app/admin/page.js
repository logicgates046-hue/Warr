'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [candidatureResults, setCandidatureResults] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push('/login');
        return;
      }

      // ===== DEBUG VERSION =====
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single();

      console.log('User ID:', authData.user.id);
      console.log('Profile:', profile);
      console.log('Profile Error:', profileError);

      if (!profile?.is_admin) {
        alert(
          `Not recognized as admin.\n\nProfile: ${JSON.stringify(profile)}\nError: ${profileError?.message || 'None'}`
        );
        router.push('/battle');
        return;
      }
      // ===== END DEBUG =====

      setIsAdmin(true);

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: wantamBattle } = await supabase
        .from('battle_votes')
        .select('*', { count: 'exact', head: true })
        .eq('side', 'WANTAM');

      const { count: tutamBattle } = await supabase
        .from('battle_votes')
        .select('*', { count: 'exact', head: true })
        .eq('side', 'TUTAM');

      const { count: candidatureVotes } = await supabase
        .from('candidature_votes')
        .select('*', { count: 'exact', head: true });

      const { count: rankingsVotes } = await supabase
        .from('rankings_votes')
        .select('*', { count: 'exact', head: true });

      const { count: joinedCommunity } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('joined_community', true);

      setStats({
        totalUsers: totalUsers || 0,
        wantamBattle: wantamBattle || 0,
        tutamBattle: tutamBattle || 0,
        candidatureVotes: candidatureVotes || 0,
        rankingsVotes: rankingsVotes || 0,
        joinedCommunity: joinedCommunity || 0,
      });

      const { data: tickets } = await supabase
        .from('tickets')
        .select(`id, side, vote_count, president:president_id ( name ), deputy:deputy_id ( name )`)
        .order('vote_count', { ascending: false });

      setCandidatureResults(tickets || []);

      setLoading(false);
    };

    load();
  }, [router]);

  if (loading) {
    return (
      <main className="home">
        <p className="loading-text">Loading admin panel...</p>
      </main>
    );
  }

  if (!isAdmin) return null;

  return (
    <main className="home">
      <section className="hero">
        <p className="eyebrow small">KE-WAR</p>
        <h1 className="battle-title">ADMIN PANEL</h1>

        <div className="admin-nav">
          <a href="/admin" className="admin-nav-item active">Overview</a>
          <a href="/admin/candidates" className="admin-nav-item">Candidates</a>
          <a href="/admin/tickets" className="admin-nav-item">Tickets</a>
          <a href="/admin/settings" className="admin-nav-item">Settings</a>
          <a href="/admin/users" className="admin-nav-item">Users</a>
        </div>

        <h2 className="profile-section-title">OVERVIEW</h2>
        <div className="profile-card">
          <div className="profile-row">
            <span className="profile-label">TOTAL USERS</span>
            <span className="profile-value highlight">{stats.totalUsers}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">WANTAM BATTLE VOTES</span>
            <span className="profile-value">{stats.wantamBattle}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">TUTAM BATTLE VOTES</span>
            <span className="profile-value">{stats.tutamBattle}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">CANDIDATURE VOTES CAST</span>
            <span className="profile-value">{stats.candidatureVotes}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">RANKINGS VOTES CAST</span>
            <span className="profile-value">{stats.rankingsVotes}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">JOINED COMMUNITY</span>
            <span className="profile-value">{stats.joinedCommunity}</span>
          </div>
        </div>

        <h2 className="profile-section-title">TICKET RESULTS</h2>
        <div className="profile-card">
          {candidatureResults.map((t) => (
            <div key={t.id} className="profile-row">
              <span className="profile-label">
                {t.side} — {t.president?.name} / {t.deputy?.name}
              </span>
              <span className="profile-value highlight">{t.vote_count}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
    }
