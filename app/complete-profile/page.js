'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const KENYAN_COUNTIES = [
  'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet', 'Embu',
  'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado', 'Kakamega', 'Kericho',
  'Kiambu', 'Kilifi', 'Kirinyaga', 'Kisii', 'Kisumu', 'Kitui', 'Kwale',
  'Laikipia', 'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
  'Meru', 'Migori', 'Mombasa', 'Murang\'a', 'Nairobi', 'Nakuru', 'Nandi',
  'Narok', 'Nyamira', 'Nyandarua', 'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta',
  'Tana River', 'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
  'Vihiga', 'Wajir', 'West Pokot',
];

function calculateAge(dobString) {
  const dob = new Date(dobString);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export default function CompleteProfilePage() {
  const [dob, setDob] = useState('');
  const [county, setCounty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUserId(data.user.id);
      }
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (calculateAge(dob) < 18) {
      setError('You must be at least 18 years old to join KE-WAR.');
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ date_of_birth: dob, county })
      .eq('id', userId);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push('/battle');
  };

  return (
    <main className="auth-page">
      <p className="eyebrow small">KE-WAR</p>
      <h1 className="auth-title">COMPLETE YOUR PROFILE</h1>
      <p className="auth-subtitle">Just a couple more details before you enter the fight. You must be 18 or older.</p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>DATE OF BIRTH</label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          required
        />

        <label>COUNTY OF RESIDENCE</label>
        <select
          value={county}
          onChange={(e) => setCounty(e.target.value)}
          required
        >
          <option value="" disabled>Select your county</option>
          {KENYAN_COUNTIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="auth-button" disabled={loading}>
          {loading ? 'SAVING...' : 'CONTINUE TO KE-WAR'}
        </button>
      </form>
    </main>
  );
}
