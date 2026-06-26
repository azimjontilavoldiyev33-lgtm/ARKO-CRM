// Ishchi uchun alohida o'rnatiladigan PWA manifesti.
// MUHIM: nested `manifest.ts` (metadata konvensiyasi) Next.js'da faqat app
// ildizida ishlaydi — shu sabab route handler sifatida beramiz, aks holda
// /ish/manifest.webmanifest 404 bo'ladi.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(
    {
      id: '/ish',
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
    },
    { headers: { 'Content-Type': 'application/manifest+json' } }
  );
}
