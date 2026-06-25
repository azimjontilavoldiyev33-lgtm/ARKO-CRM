'use client';

import { useEffect, useState, type CSSProperties } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// "Ilovani o'rnatish" tugmasi. beforeinstallprompt'ni ushlab turadi va
// bosilganda brauzerning native o'rnatish oynasini chiqaradi.
// iOS Safari'da bu API yo'q — shuning uchun qo'lda qo'shish qo'llanmasi ko'rsatiladi.
export default function InstallPWAButton({
  style,
  fullWidth = false,
}: {
  style?: CSSProperties;
  fullWidth?: boolean;
}) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    // Allaqachon o'rnatilgan (standalone rejimda ochilgan) — tugma kerak emas
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    const ua = window.navigator.userAgent.toLowerCase();
    // iPad iOS 13+ "Macintosh" deb ko'rsatadi — touch bilan aniqlaymiz
    const iOS = /iphone|ipad|ipod/.test(ua) || (/macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    setIsIOS(iOS);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  // O'rnatilgan bo'lsa yoki o'rnatish imkoniyati yo'q bo'lsa — hech narsa chiqarmaymiz
  if (installed) return null;
  if (!deferred && !isIOS) return null;

  const handleClick = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setDeferred(null);
    } else if (isIOS) {
      setIosHint((v) => !v);
    }
  };

  return (
    <div style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <button
        onClick={handleClick}
        aria-label="Ilovani o'rnatish"
        style={{
          width: fullWidth ? '100%' : 'auto',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #f5cf5a 0%, #e6b733 100%)',
          color: '#0f1117',
          border: 'none',
          borderRadius: '10px',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 700,
          fontFamily: 'var(--font-display)',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(240,192,64,0.25)',
          ...style,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
        Ilovani o&apos;rnatish
      </button>

      {iosHint && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#1a1d27',
            border: '1px solid #2a2d3a',
            borderRadius: '12px',
            padding: '12px 14px',
            fontSize: '12px',
            color: '#cfd2dc',
            lineHeight: 1.6,
            boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
            zIndex: 100,
            fontFamily: 'var(--font-sans)',
          }}
        >
          iPhone&apos;da o&apos;rnatish: pastdagi <b>Ulashish</b> (⤴) tugmasini bosing →{' '}
          <b>&quot;Bosh ekranga qo&apos;shish&quot;</b> ni tanlang.
        </div>
      )}
    </div>
  );
}
