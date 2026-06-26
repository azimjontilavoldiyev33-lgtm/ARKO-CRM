'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Mode = 'admin' | 'worker';

const OPTIONS: { mode: Mode; icon: string; label: string; sub: string; url: string }[] = [
  {
    mode: 'admin',
    icon: '🖥️',
    label: 'Admin uchun',
    sub: 'Boshqaruv paneli',
    url: '/admin',
  },
  {
    mode: 'worker',
    icon: '📱',
    label: 'Ishchi uchun',
    sub: 'Davomat va vazifalar',
    url: '/ish',
  },
];

export default function InstallPWAButton({
  style,
  fullWidth = false,
  dropUp = false,
}: {
  style?: CSSProperties;
  fullWidth?: boolean;
  dropUp?: boolean;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [open, setOpen] = useState(false);
  const [iosMode, setIosMode] = useState<Mode | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) { setInstalled(true); return; }

    const ua = window.navigator.userAgent.toLowerCase();
    const iOS =
      /iphone|ipad|ipod/.test(ua) ||
      (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setIosMode(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // O'rnatilgan bo'lsa ko'rsatmaymiz
  if (installed) return null;

  const handleOption = async (mode: Mode) => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') {
        setDeferred(null);
        setOpen(false);
      }
    } else if (isIOS) {
      setIosMode(mode);
    } else {
      // Brauzer install qo'llab-quvvatlamasa — sahifaga yo'naltirish
      const url = OPTIONS.find((o) => o.mode === mode)?.url ?? '/';
      window.location.href = url;
    }
  };

  const iosOpt = OPTIONS.find((o) => o.mode === iosMode);

  const dropdownPos: CSSProperties = dropUp
    ? { bottom: '100%', top: 'auto', borderRadius: '12px 12px 0 0', borderBottom: 'none', borderTop: '1px solid #2a2d3a' }
    : { top: '100%', bottom: 'auto', borderRadius: '0 0 12px 12px', borderTop: 'none', borderBottom: '1px solid #2a2d3a' };

  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: fullWidth ? '100%' : 'auto', display: 'inline-block', ...style }}
    >
      {/* Asosiy tugma */}
      <button
        onClick={() => { setOpen((v) => !v); setIosMode(null); }}
        aria-expanded={open}
        aria-label="Ilovani o'rnatish"
        style={{
          width: fullWidth ? '100%' : 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: open
            ? 'linear-gradient(135deg, #e6b733 0%, #d4a520 100%)'
            : 'linear-gradient(135deg, #f5cf5a 0%, #e6b733 100%)',
          color: '#0f1117',
          border: 'none',
          borderRadius: open
            ? (dropUp ? '0 0 10px 10px' : '10px 10px 0 0')
            : '10px',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(240,192,64,0.25)',
          transition: 'border-radius 0.15s',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        Ilovani o&apos;rnatish
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: fullWidth ? 0 : 'auto',
            minWidth: fullWidth ? '100%' : 220,
            background: '#1a1d27',
            border: '1px solid #2a2d3a',
            overflow: 'hidden',
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            zIndex: 300,
            ...dropdownPos,
          }}
        >
          {OPTIONS.map((opt, i) => (
            <button
              key={opt.mode}
              onClick={() => handleOption(opt.mode)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '13px 16px',
                background: 'transparent',
                border: 'none',
                borderTop: i === 0 ? 'none' : '1px solid #23263a',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#22253a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: opt.mode === 'admin' ? '#15233a' : '#1a2a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}
              >
                {opt.icon}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ color: '#e8e8e8', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                  {opt.label}
                </span>
                <span style={{ color: '#666', fontSize: 11 }}>{opt.sub}</span>
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginLeft: 'auto', flexShrink: 0 }}
                aria-hidden="true"
              >
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            </button>
          ))}

          {/* iOS ko'rsatma */}
          {iosMode && iosOpt && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #23263a',
                background: '#14161f',
                fontSize: 12,
                color: '#cfd2dc',
                lineHeight: 1.7,
              }}
            >
              <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#f0c040' }}>
                {iosOpt.icon} {iosOpt.label} uchun:
              </p>
              <p style={{ margin: 0 }}>
                1. Safari&apos;da <b>{iosOpt.url}</b> sahifasini oching
                <br />
                2. Pastdagi <b>Ulashish</b> (⤴) tugmasini bosing
                <br />
                3. <b>&quot;Bosh ekranga qo&apos;shish&quot;</b> ni tanlang
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
