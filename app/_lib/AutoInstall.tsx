'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface DeferredPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ?autoinstall=1 bo'lsa — beforeinstallprompt kelganda avtomatik chiqaradi.
// MUHIM: useSearchParams ishlatilgani uchun chaqirilgan joyda <Suspense> ichida
// bo'lishi shart (Next.js statik prerender talabi).
export default function AutoInstall() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('autoinstall') !== '1') return;
    const handler = (e: Event) => {
      e.preventDefault();
      (e as DeferredPrompt).prompt();
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [searchParams]);

  return null;
}
