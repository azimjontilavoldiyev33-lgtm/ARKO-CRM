'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveSession, getToken, getDeviceId } from '../_lib/store';

export default function IshLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Allaqachon kirgan bo'lsa — to'g'ridan-to'g'ri ilovaga
  useEffect(() => {
    if (getToken()) router.replace('/ish');
  }, [router]);

  const handleSubmit = async () => {
    const value = phone.trim();
    const codeValue = code.trim();
    if (!value) return;
    if (!/^\d{4}$/.test(codeValue)) { setError('4 xonali kodni kiriting'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/mobile/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: value, code: codeValue, deviceId: getDeviceId() }),
      });
      const data = await res.json();
      if (data?.success && data.token) {
        saveSession(data.token, data.worker);
        router.replace('/ish');
      } else {
        setError(data?.message || 'Ishchi topilmadi');
      }
    } catch {
      setError('Tarmoq xatosi. Internetni tekshiring.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.wrap}>
<div aria-hidden style={S.glow} />

      <div style={{ width: 400, maxWidth: '100%', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={S.logo}>T</div>
          <h1 style={S.title}>Tabel</h1>
          <p style={{ color: '#666', margin: 0, fontSize: 14 }}>Ishchi davomat ilovasi</p>
        </div>

        <div style={S.card}>
          <div aria-hidden style={S.accent} />

          {error && <div style={S.error}>❌ {error}</div>}

          <label style={S.label} htmlFor="ish-phone">Telefon raqamingiz</label>
          <input
            id="ish-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+998 90 123 45 67"
            className="tabel-input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={S.input}
          />

          <label style={S.label} htmlFor="ish-code">Kirish kodi</label>
          <input
            id="ish-code"
            type="text"
            inputMode="numeric"
            maxLength={4}
            autoComplete="one-time-code"
            placeholder="4 xonali kod"
            className="tabel-input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            style={S.input}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="tabel-btn"
            style={{ ...S.btn, opacity: loading ? 0.7 : 1, cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? 'Kirilmoqda...' : 'Kirish →'}
          </button>

          <p style={{ color: '#4a4d5a', fontSize: 12, textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
            Ro'yxatdan o'tmagan bo'lsangiz administrator bilan bog'laning.
          </p>
        </div>
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

const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: '#0b0d13',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "var(--font-sans)",
    position: 'relative',
    overflow: 'hidden',
    padding: 20,
  },
  glow: {
    position: 'absolute',
    top: '-15%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 700,
    height: 500,
    background: 'radial-gradient(circle, rgba(240,192,64,0.16) 0%, rgba(240,192,64,0) 70%)',
    pointerEvents: 'none',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 18,
    background: 'linear-gradient(135deg, #f5cf5a 0%, #e0b030 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 26,
    fontWeight: 800,
    color: '#0f1117',
    fontFamily: "var(--font-display)",
    margin: '0 auto 18px',
    boxShadow: '0 8px 30px rgba(240,192,64,0.35)',
  },
  title: {
    fontFamily: "var(--font-display)",
    fontSize: 30,
    fontWeight: 800,
    margin: '0 0 8px',
    background: 'linear-gradient(135deg, #fff 0%, #999 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    letterSpacing: '-0.5px',
  },
  card: {
    position: 'relative',
    background: '#14161f',
    borderRadius: 20,
    padding: 32,
    border: '1px solid #23263a',
    boxShadow: '0 20px 50px rgba(0,0,0,0.4)',
  },
  accent: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    background: 'linear-gradient(90deg, transparent, rgba(240,192,64,0.5), transparent)',
  },
  error: {
    background: '#2a1414',
    border: '1px solid #4a1a1a',
    borderRadius: 10,
    padding: '12px 16px',
    marginBottom: 20,
    color: '#f87171',
    fontSize: 13,
  },
  label: {
    display: 'block',
    color: '#888',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    background: '#0b0d13',
    border: '1px solid #2a2d3a',
    borderRadius: 10,
    padding: '13px 16px',
    color: '#e8e8e8',
    fontSize: 16,
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: 20,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  btn: {
    width: '100%',
    background: 'linear-gradient(135deg, #f5cf5a 0%, #e6b733 100%)',
    color: '#0f1117',
    border: 'none',
    borderRadius: 10,
    padding: 14,
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: 15,
    transition: 'transform 0.12s, box-shadow 0.15s',
  },
};
