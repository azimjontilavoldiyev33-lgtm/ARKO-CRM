// Admin uchun alohida o'rnatiladigan PWA manifesti.
// MUHIM: nested `manifest.ts` (metadata konvensiyasi) Next.js'da faqat app
// ildizida ishlaydi — shu sabab route handler sifatida beramiz, aks holda
// /admin/manifest.webmanifest 404 bo'ladi.
export const dynamic = 'force-static';

export function GET() {
  return Response.json(
    {
      id: '/admin',
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
    },
    { headers: { 'Content-Type': 'application/manifest+json' } }
  );
}
