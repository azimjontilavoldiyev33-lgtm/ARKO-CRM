'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) return;
    setLoading(true);
    setError('');

    const res = await signIn('credentials', {
      username: form.username,
      password: form.password,
      redirect: false,
    });

    if (res?.ok) {
      router.push('/admin');
    } else {
      setError('Login yoki parol noto\'g\'ri!');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      <div style={{ width: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#f0c040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 800, color: '#0f1117', fontFamily: "'Syne', sans-serif", margin: '0 auto 16px' }}>T</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: '28px', fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Tabel
          </h1>
          <p style={{ color: '#555', margin: 0, fontSize: '14px' }}>Davomat va CRM tizimi — kirish</p>
        </div>

        {/* Form */}
        <div style={{ background: '#1a1d27', borderRadius: '20px', padding: '32px', border: '1px solid #2a2d3a' }}>
          {error && (
            <div style={{ background: '#2a1414', border: '1px solid #4a1a1a', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#f87171', fontSize: '13px' }}>
              ❌ {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Login</label>
            <input
              type="text"
              placeholder="admin"
              value={form.username}
              onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '12px 16px', color: '#e8e8e8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Parol</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '12px 16px', color: '#e8e8e8', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', background: '#f0c040', color: '#0f1117', border: 'none', borderRadius: '10px', padding: '14px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
          >
            {loading ? 'Kirilmoqda...' : 'Kirish →'}
          </button>
        </div>
      </div>
    </div>
  );
}