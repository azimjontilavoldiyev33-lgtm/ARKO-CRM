import type { MetadataRoute } from 'next';

// Butun loyiha uchun yagona PWA manifesti (admin CRM + ishchi davomat portali).
// scope '/' — barcha sahifalar PWA ichida ochiladi. Ikki bo'lim uchun
// shortcut'lar berilgan: Boshqaruv (admin) va Davomat (ishchi).
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Tabel — Davomat va CRM',
    short_name: 'Tabel',
    description: 'Mebel sexlari uchun davomat va CRM tizimi',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#0f1117',
    theme_color: '#0f1117',
    lang: 'uz',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      {
        name: 'Boshqaruv paneli',
        short_name: 'Admin',
        description: 'CRM boshqaruv paneli',
        url: '/admin',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Davomat (Ishchi)',
        short_name: 'Davomat',
        description: 'Keldi / Ketdi belgilash',
        url: '/ish',
        icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
      },
    ],
  };
}
