import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tabel — Ishchi',
    short_name: 'Davomat',
    description: 'Keldi / Ketdi davomat va vazifalar',
    start_url: '/ish',
    scope: '/ish',
    display: 'standalone',
    background_color: '#0b0d13',
    theme_color: '#0b0d13',
    lang: 'uz',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
