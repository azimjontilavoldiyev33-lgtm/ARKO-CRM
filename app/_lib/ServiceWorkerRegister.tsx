'use client';

import { useEffect } from 'react';

// Service worker'ni butun ilova uchun (scope '/') brauzerda ro'yxatdan o'tkazadi.
// Yangi SW versiyasi tayyor bo'lganda — sahifa avtomatik yangilanadi (bir marta).
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Yangi versiyani darhol qo'llash uchun davriy tekshiruv
        reg.update().catch(() => {});
      })
      .catch(() => {
        /* SW ro'yxatdan o'tmasa ham ilova ishlayveradi */
      });
  }, []);

  return null;
}
