'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LiveTicker() {
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    try {
      const [{ count: wantamCount }, { count: tutamCount }, { count: totalUsers }] =
        await Promise.all([
          supabase
            .from('battle_votes')
            .select('*', { count: 'exact', head: true })
            .eq('side', 'WANTAM'),
          supabase
            .from('battle_votes')
            .select('*', { count: 'exact', head: true })
            .eq('side', 'TUTAM'),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true }),
        ]);

      setStats({
        wantam: wantamCount || 0,
        tutam: tutamCount || 0,
        total: totalUsers || 0,
      });
    } catch (err) {
      console.error('Ticker load error:', err);
    }
  };

  useEffect(() => {
    // Load immediately
    loadStats();

    // Poll every 10 seconds (faster than before)
    const interval = setInterval(loadStats, 10000);

    // Real-time updates when new votes or users appear
    const battleChannel = supabase
      .channel('ticker-battle-votes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'battle_votes' },
        () => loadStats()
      )
      .subscribe();

    const profilesChannel = supabase
      .channel('ticker-profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => loadStats()
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(battleChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, []);

  const message = stats
    ? `🔴 LIVE — ${stats.wantam} WANTAM votes · ${stats.tutam} TUTAM votes · ${stats.total} Kenyans have joined KE-WAR · Which are you in?`
    : '🔴 LIVE — Loading the latest numbers...';

  return (
    <div className="ticker-wrap">
      <div className="ticker">
        {message} &nbsp;&nbsp;&nbsp;&nbsp; {message} &nbsp;&nbsp;&nbsp;&nbsp;
      </div>
    </div>
  );
}
