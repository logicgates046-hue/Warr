'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import BottomNav from '@/components/BottomNav';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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
              {ticket ? `${ticket.president.name} / ${ticket.deputy.name}` : 'Not voted yet'}
            </span>
          </div>
          <div className="profile-row">
            <span className="profile-label">RANKINGS VOTE</span>
            <span className="profile-value">{profile?.rankings_vote || 'Not voted yet'}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">COMMUNITY GROUP</span>
            <span className="profile-value">{profile?.joined_community ? 'Joined' : 'Not joined yet'}</span>
          </div>
        </div>

        <button onClick={handleLogout} className="logout-button">LOGOUT</button>
      </section>

      <BottomNav />
    </main>
  );
    }
