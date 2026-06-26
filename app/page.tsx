'use client';

import { useState, useEffect, type ComponentType, type CSSProperties } from 'react';
import {
  LayoutDashboard, Smartphone, Package, Users, Wallet, BarChart3, Workflow,
  MapPin, ListChecks, Play, CalendarClock, Bell,
  Download, Check, ArrowRight, Share, X,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type IconType = ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;

export default function LandingPage() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
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
      setDeferred(e as BeforeInstallPromptEvent);
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
    if (isIOS) { setIosTarget(target); return; }
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setDeferred(null);
    } else {
      window.location.href = target === 'admin' ? '/admin?autoinstall=1' : '/ish?autoinstall=1';
    }
  };

  return (
    <div style={S.page}>
      <div aria-hidden style={S.glow} />

      <header style={S.header}>
        <p style={S.eyebrow}>Davomat + CRM tizimi</p>
        <h1 style={S.title}>Tabel</h1>
        <p style={S.subtitle}>
          Mebel sexlari uchun davomat va ishlab chiqarish boshqaruv tizimi
        </p>
      </header>

      <div style={S.grid}>
        <Card
          Icon={LayoutDashboard}
          accent="var(--color-info)"
          title="Admin paneli"
          subtitle="Boshqaruvchi uchun"
          features={[
            { Icon: Package, label: 'Buyurtmalar boshqaruvi' },
            { Icon: Users, label: 'Ustalar va vazifalar' },
            { Icon: Wallet, label: 'Moliya va oylik hisob' },
            { Icon: BarChart3, label: 'KPI va hisobotlar' },
            { Icon: Workflow, label: 'Ishlab chiqarish zanjiri' },
          ]}
          installed={installed}
          onInstall={() => handleInstall('admin')}
          iosHint={iosTarget === 'admin'}
          iosUrl="/admin"
          onIosClose={() => setIosTarget(null)}
          loginUrl="/login"
        />

        <Card
          Icon={Smartphone}
          accent="var(--color-success)"
          title="Ishchi portali"
          subtitle="Ustalar uchun"
          features={[
            { Icon: MapPin, label: 'GPS davomat qaydlash' },
            { Icon: ListChecks, label: "Vazifalar ro'yxati" },
            { Icon: Play, label: 'Vazifani boshlash / tugatish' },
            { Icon: CalendarClock, label: 'Bugungi ish holati' },
            { Icon: Bell, label: 'Push bildirishnomalar' },
          ]}
          installed={installed}
          onInstall={() => handleInstall('worker')}
          iosHint={iosTarget === 'worker'}
          iosUrl="/ish"
          onIosClose={() => setIosTarget(null)}
          loginUrl="/ish/login"
        />
      </div>

      <p style={S.footer}>Tabel — arko-crm.vercel.app</p>
    </div>
  );
}

function Card({
  Icon, accent, title, subtitle, features,
  installed, onInstall, iosHint, iosUrl, onIosClose, loginUrl,
}: {
  Icon: IconType; accent: string; title: string; subtitle: string;
  features: { Icon: IconType; label: string }[];
  installed: boolean; onInstall: () => void;
  iosHint: boolean; iosUrl: string; onIosClose: () => void; loginUrl: string;
}) {
  return (
    <div style={{ ...S.card, borderTop: `2px solid ${accent}` }}>
      <div style={S.cardHead}>
        <span style={{ ...S.iconBox, background: `color-mix(in srgb, ${accent} 14%, transparent)`, borderColor: `color-mix(in srgb, ${accent} 35%, transparent)` }}>
          <Icon size={24} strokeWidth={1.8} color={accent} />
        </span>
        <div>
          <h2 style={S.cardTitle}>{title}</h2>
          <p style={{ ...S.cardSubtitle, color: accent }}>{subtitle}</p>
        </div>
      </div>

      <ul style={S.featureList}>
        {features.map(({ Icon: FIcon, label }) => (
          <li key={label} style={S.featureItem}>
            <FIcon size={16} strokeWidth={1.8} color="var(--color-faint)" />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onInstall}
        disabled={installed}
        className="install-btn"
        style={{
          ...S.btn,
          background: installed ? 'var(--color-surface)' : accent,
          color: installed ? 'var(--color-faint)' : '#0b0d13',
          cursor: installed ? 'default' : 'pointer',
          boxShadow: installed ? 'none' : `0 8px 24px color-mix(in srgb, ${accent} 28%, transparent)`,
        }}
      >
        {installed ? <Check size={17} strokeWidth={2.2} /> : <Download size={17} strokeWidth={2.2} />}
        {installed ? "O'rnatilgan" : "Ilovani o'rnatish"}
      </button>

      {iosHint && (
        <div style={S.iosBox}>
          <button onClick={onIosClose} style={S.iosClose} aria-label="Yopish">
            <X size={16} />
          </button>
          <p style={S.iosTitle}>iPhone / iPad uchun:</p>
          <p style={{ margin: 0 }}>
            1. Safari&apos;da <b>{iosUrl}</b> sahifasini oching<br />
            2. Pastdagi <b>Ulashish</b> <Share size={12} style={{ verticalAlign: 'middle' }} /> tugmasini bosing<br />
            3. <b>&quot;Bosh ekranga qo&apos;shish&quot;</b> ni tanlang
          </p>
        </div>
      )}

      <a href={loginUrl} style={S.loginLink}>
        Yoki brauzerda ochish <ArrowRight size={13} style={{ verticalAlign: 'middle' }} />
      </a>
    </div>
  );
}

const S: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-base)',
    fontFamily: 'var(--font-sans)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '56px 20px 60px',
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    top: '-12%',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 760,
    height: 520,
    maxWidth: '120vw',
    background: 'radial-gradient(circle, rgba(240,192,64,0.07) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  header: { textAlign: 'center', marginBottom: 48, position: 'relative', zIndex: 1 },
  eyebrow: {
    color: 'var(--color-accent)', fontSize: 11, letterSpacing: 3,
    textTransform: 'uppercase', margin: '0 0 14px', fontWeight: 600,
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontSize: 'clamp(40px, 9vw, 68px)',
    fontWeight: 800,
    margin: '0 0 16px',
    background: 'linear-gradient(135deg, #fff 0%, #8a8d99 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1.05,
  },
  subtitle: { color: 'var(--color-muted)', fontSize: 16, margin: 0, maxWidth: 440, lineHeight: 1.6 },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
    gap: 20,
    width: '100%',
    maxWidth: 720,
    position: 'relative',
    zIndex: 1,
  },
  card: {
    background: 'var(--color-panel)',
    border: '1px solid var(--color-border-soft)',
    borderRadius: 22,
    padding: '26px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  cardHead: { display: 'flex', alignItems: 'center', gap: 14 },
  iconBox: {
    width: 52, height: 52, borderRadius: 15,
    border: '1px solid',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: { fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--color-text)', margin: 0 },
  cardSubtitle: { fontSize: 12, margin: '3px 0 0', fontWeight: 600 },
  featureList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 },
  featureItem: { color: 'var(--color-muted)', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 10 },
  btn: {
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 13,
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    fontSize: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'transform 0.12s ease, opacity 0.15s ease',
  },
  iosBox: {
    background: 'var(--color-bg)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    padding: '14px 16px',
    fontSize: 12,
    color: '#cfd2dc',
    lineHeight: 1.9,
    position: 'relative',
  },
  iosClose: { position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'var(--color-faint)', cursor: 'pointer', display: 'flex', padding: 0 },
  iosTitle: { margin: '0 0 6px', fontWeight: 700, color: 'var(--color-accent)' },
  loginLink: { display: 'block', textAlign: 'center', color: 'var(--color-faint)', fontSize: 12, textDecoration: 'none', marginTop: -6 },
  footer: { color: '#2a2d3a', fontSize: 12, marginTop: 48, position: 'relative', zIndex: 1 },
};
