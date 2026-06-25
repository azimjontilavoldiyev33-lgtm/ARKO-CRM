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
    <div style={{
      minHeight: '100vh',
      background: '#0b0d13',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "var(--font-sans)",
      position: 'relative',
      overflow: 'hidden',
      padding: '20px',
    }}>
{/* Ambient fon — oltin nur + vignette */}
      <div aria-hidden style={{ position: 'absolute', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '500px', background: 'radial-gradient(circle, rgba(240,192,64,0.16) 0%, rgba(240,192,64,0) 70%)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, rgba(96,165,250,0) 70%)', pointerEvents: 'none' }} />

      <div style={{ width: '400px', maxWidth: '100%', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '60px', height: '60px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #f5cf5a 0%, #e0b030 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '26px', fontWeight: 800, color: '#0f1117',
            fontFamily: "var(--font-display)", margin: '0 auto 18px',
            boxShadow: '0 8px 30px rgba(240,192,64,0.35)',
          }}>T</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: '30px', fontWeight: 800, margin: '0 0 8px', background: 'linear-gradient(135deg, #fff 0%, #999 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px' }}>
            Tabel
          </h1>
          <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>Davomat va CRM tizimi</p>
        </div>

        {/* Form karta */}
        <div style={{ position: 'relative', background: '#14161f', borderRadius: '20px', padding: '32px', border: '1px solid #23263a', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
          {/* Yuqori aksent chizig'i */}
          <div aria-hidden style={{ position: 'absolute', top: 0, left: '24px', right: '24px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(240,192,64,0.5), transparent)' }} />

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
              className="tabel-input"
              value={form.username}
              onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', background: '#0b0d13', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '13px 16px', color: '#e8e8e8', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', color: '#888', fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>Parol</label>
            <input
              type="password"
              placeholder="••••••••"
              className="tabel-input"
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', background: '#0b0d13', border: '1px solid #2a2d3a', borderRadius: '10px', padding: '13px 16px', color: '#e8e8e8', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s' }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="tabel-btn"
            style={{ width: '100%', background: 'linear-gradient(135deg, #f5cf5a 0%, #e6b733 100%)', color: '#0f1117', border: 'none', borderRadius: '10px', padding: '14px', fontFamily: "var(--font-display)", fontWeight: 700, fontSize: '15px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'transform 0.12s, box-shadow 0.15s' }}
          >
            {loading ? 'Kirilmoqda...' : 'Kirish →'}
          </button>
        </div>

        {/* Footer */}
        <p style={{ textAlign: 'center', color: '#3a3d4a', fontSize: '12px', marginTop: '24px' }}>
          Tabel — mebel sexlari uchun davomat va CRM
        </p>
      </div>

      <style>{`
        .tabel-input::placeholder { color: #4a4d5a; }
        .tabel-input:focus { border-color: #f0c040 !important; box-shadow: 0 0 0 3px rgba(240,192,64,0.12); }
        .tabel-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(240,192,64,0.3); }
        .tabel-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>
    </div>
  );
}
