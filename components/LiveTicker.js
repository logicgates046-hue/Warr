'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LiveTicker() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const { count: wantamCount } = await supabase
        .from('battle_votes')
        .select('*', { count: 'exact', head: true })
        .eq('side', 'WANTAM');

      const { count: tutamCount } = await supabase
        .from('battle_votes')
        .select('*', { count: 'exact', head: true })
        .eq('side', 'TUTAM');

      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setStats({
        wantam: wantamCount || 0,
        tutam: tutamCount || 0,
        total: totalUsers || 0,
      });
    };

    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
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
