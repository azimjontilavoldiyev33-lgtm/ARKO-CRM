import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oflayn — Tabel',
};

// Internet bo'lmaganda SW shu sahifani ko'rsatadi (cache'dan).
export default function OfflinePage() {
  return (
    <div
      className="flex-1 min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--color-bg, #0f1117)', color: 'var(--color-text, #e8e8e8)' }}
    >
      <div className="w-full max-w-sm text-center">
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl"
          style={{ background: '#1a1d27', border: '1px solid #2a2d3a' }}
        >
          📡
        </div>
        <h1
          className="text-2xl font-extrabold m-0 mb-3"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Internet yo&apos;q
        </h1>
        <p className="text-sm m-0 mb-7" style={{ color: '#9aa0ad', lineHeight: 1.6 }}>
          Hozir oflayn rejimdasiz. Ulanish tiklangach sahifa qaytadan yuklanadi.
          Ilgari ochilgan bo&apos;limlar oflaynda ham ishlashi mumkin.
        </p>
        {/* Oflayndan qayta ulanish uchun to'liq reload kerak — Link (client-nav) emas */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="inline-block rounded-xl px-6 py-3 text-sm font-bold no-underline"
          style={{
            background: 'linear-gradient(135deg, #f5cf5a 0%, #e6b733 100%)',
            color: '#0f1117',
            fontFamily: 'var(--font-display)',
          }}
        >
          Qayta urinish
        </a>
      </div>
    </div>
  );
}
