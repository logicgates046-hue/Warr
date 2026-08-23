'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // 1. Sign in
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    // 2. Get the profile and check if admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('county, is_admin')
      .eq('id', userId)
      .single();

    setLoading(false);

    if (profileError) {
      setError('Could not load profile: ' + profileError.message);
      return;
    }

    // 3. Decision
    if (profile?.is_admin === true) {
      // Admin → go straight to Admin Panel
      router.push('/admin');
    } else if (!profile?.county) {
      // Normal user who hasn't completed profile
      router.push('/complete-profile');
    } else {
      // Normal user
      router.push('/battle');
    }
  };

  return (
    <main className="auth-page">
      <a href="/" className="back-link">← KE-WAR</a>

      <p className="eyebrow small">KE-WAR</p>
      <h1 className="auth-title">WELCOME BACK</h1>
      <p className="auth-subtitle">Enter your KE-WAR account to continue.</p>

      <form onSubmit={handleLogin} className="auth-form">
        <label>EMAIL</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>PASSWORD</label>
        <input
          type="password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'LOGGING IN...' : 'LOGIN'}
        </button>
      </form>

      <p className="login-text">
        Don't have a KE-WAR account? <a href="/register">REGISTER</a>
      </p>
    </main>
  );
}
