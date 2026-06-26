'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function LandingPage() {
  const [adminDeferred, setAdminDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [iosTarget, setIosTarget] = useState<'admin' | 'worker' | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) { setInstalled(true); return; }

    const ua = navigator.userAgent.toLowerCase();
    const iOS =
      /iphone|ipad|ipod/.test(ua) ||
      (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setAdminDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async (target: 'admin' | 'worker') => {
    if (isIOS) {
      setIosTarget(target);
      return;
    }
    if (adminDeferred) {
      await adminDeferred.prompt();
      const { outcome } = await adminDeferred.userChoice;
      if (outcome === 'accepted') setAdminDeferred(null);
    } else {
      window.location.href = target === 'admin' ? '/admin?autoinstall=1' : '/ish?autoinstall=1';
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0b0d13',
      fontFamily: 'var(--font-sans)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px 60px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow effekti */}
      <div aria-hidden style={{
        position: 'absolute',
        top: '-10%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 700,
        height: 500,
        background: 'radial-gradient(circle, rgba(240,192,64,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Header */}
      <header style={{ textAlign: 'center', marginBottom: 56, position: 'relative', zIndex: 1 }}>
        <p style={{ color: '#f0c040', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 14px' }}>
          Davomat + CRM tizimi
        </p>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(36px, 8vw, 64px)',
          fontWeight: 800,
          margin: '0 0 16px',
          background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.1,
        }}>
          Tabel
        </h1>
        <p style={{ color: '#666', fontSize: 16, margin: 0, maxWidth: 420, lineHeight: 1.6 }}>
          Mebel sexlari uchun davomat va ishlab chiqarish boshqaruv tizimi
        </p>
      </header>

      {/* Kartochkalar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20,
        width: '100%',
        maxWidth: 720,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Admin kartochkasi */}
        <Card
          icon="🖥️"
          color="#60a5fa"
          bg="#0d1a2e"
          border="#1a3050"
          title="Admin paneli"
          subtitle="Boshqaruvchi uchun"
          features={[
            '📦 Buyurtmalar boshqaruvi',
            '👷 Ustalar va vazifalar',
            '💰 Moliya va oylik hisob',
            '📊 KPI va hisobotlar',
            '🔗 Ishlab chiqarish zanjiri',
          ]}
          btnLabel={installed ? '✓ O\'rnatilgan' : '⬇ Admin ilovasini o\'rnatish'}
          btnDisabled={installed}
          btnBg="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
          btnShadow="rgba(59,130,246,0.3)"
          onInstall={() => handleInstall('admin')}
          iosHint={iosTarget === 'admin'}
          iosUrl="/admin"
          onIosClose={() => setIosTarget(null)}
          loginUrl="/login"
        />

        {/* Ishchi kartochkasi */}
        <Card
          icon="📱"
          color="#4ade80"
          bg="#0d2218"
          border="#1a4030"
          title="Ishchi portali"
          subtitle="Ustalar uchun"
          features={[
            '📍 GPS davomat qaydlash',
            '✅ Vazifalar ro\'yxati',
            '▶ Vazifani boshlash/tugatish',
            '📅 Bugungi ish holati',
            '🔔 Push bildirishnomalar',
          ]}
          btnLabel={installed ? '✓ O\'rnatilgan' : '⬇ Ishchi ilovasini o\'rnatish'}
          btnDisabled={installed}
          btnBg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
          btnShadow="rgba(34,197,94,0.3)"
          onInstall={() => handleInstall('worker')}
          iosHint={iosTarget === 'worker'}
          iosUrl="/ish"
          onIosClose={() => setIosTarget(null)}
          loginUrl="/ish/login"
        />
      </div>

      <p style={{ color: '#2a2d3a', fontSize: 12, marginTop: 48, position: 'relative', zIndex: 1 }}>
        Tabel — arko-crm.vercel.app
      </p>
    </div>
  );
}

function Card({
  icon, color, bg, border, title, subtitle, features,
  btnLabel, btnDisabled, btnBg, btnShadow,
  onInstall, iosHint, iosUrl, onIosClose, loginUrl,
}: {
  icon: string; color: string; bg: string; border: string;
  title: string; subtitle: string; features: string[];
  btnLabel: string; btnDisabled: boolean; btnBg: string; btnShadow: string;
  onInstall: () => void; iosHint: boolean; iosUrl: string;
  onIosClose: () => void; loginUrl: string;
}) {
  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 24,
      padding: '28px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {/* Sarlavha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          width: 52, height: 52,
          borderRadius: 16,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26,
          flexShrink: 0,
        }}>
          {icon}
        </span>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
            {title}
          </h2>
          <p style={{ color: color, fontSize: 12, margin: '2px 0 0', fontWeight: 600 }}>{subtitle}</p>
        </div>
      </div>

      {/* Xususiyatlar */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f, i) => (
          <li key={i} style={{ color: '#9aa0ad', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            {f}
          </li>
        ))}
      </ul>

      {/* O'rnatish tugmasi */}
      <button
        onClick={onInstall}
        disabled={btnDisabled}
        style={{
          width: '100%',
          padding: '14px',
          background: btnDisabled ? '#1a1d27' : btnBg,
          border: 'none',
          borderRadius: 14,
          color: btnDisabled ? '#555' : '#fff',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          cursor: btnDisabled ? 'default' : 'pointer',
          boxShadow: btnDisabled ? 'none' : `0 8px 24px ${btnShadow}`,
          transition: 'opacity 0.15s, transform 0.1s',
        }}
        onMouseEnter={(e) => { if (!btnDisabled) e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      >
        {btnLabel}
      </button>

      {/* iOS ko'rsatma */}
      {iosHint && (
        <div style={{
          background: '#14161f',
          border: '1px solid #2a2d3a',
          borderRadius: 12,
          padding: '14px 16px',
          fontSize: 12,
          color: '#cfd2dc',
          lineHeight: 1.8,
          position: 'relative',
        }}>
          <button
            onClick={onIosClose}
            style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16 }}
          >✕</button>
          <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#f0c040' }}>iPhone / iPad uchun:</p>
          <p style={{ margin: 0 }}>
            1. Safari&apos;da <b>{iosUrl}</b> sahifasini oching<br />
            2. Pastdagi <b>Ulashish ⤴</b> tugmasini bosing<br />
            3. <b>&quot;Bosh ekranga qo&apos;shish&quot;</b> ni tanlang
          </p>
        </div>
      )}

      {/* Kirish havolasi */}
      <a
        href={loginUrl}
        style={{
          display: 'block',
          textAlign: 'center',
          color: '#444',
          fontSize: 12,
          textDecoration: 'none',
          marginTop: -8,
        }}
      >
        Yoki brauzerda ochish →
      </a>
    </div>
  );
}
