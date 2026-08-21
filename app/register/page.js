'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      router.push('/complete-profile');
    } else {
      setError('Check your email to confirm your account, then log in.');
    }
  };

  return (
    <main className="auth-page">
      <a href="/" className="back-link">← KE-WAR</a>

      <p className="eyebrow small">KE-WAR</p>
      <h1 className="auth-title">CREATE YOUR ACCOUNT</h1>
      <p className="auth-subtitle">Register to enter KE-WAR and make your voice heard.</p>

      <form onSubmit={handleRegister} className="auth-form">
        <label>FULL NAME</label>
        <input
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />

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
          placeholder="Minimum 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'CREATING ACCOUNT...' : 'CREATE KE-WAR ACCOUNT'}
        </button>
      </form>

      <p className="login-text">
        Already have a KE-WAR account? <a href="/login">LOGIN</a>
      </p>
    </main>
  );
}
