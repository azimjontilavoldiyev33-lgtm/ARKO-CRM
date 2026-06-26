import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tabel — Admin',
    short_name: 'Tabel Admin',
    description: 'Boshqaruv paneli — buyurtmalar, ustalar, vazifalar',
    start_url: '/admin',
    scope: '/admin',
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
  };
}
