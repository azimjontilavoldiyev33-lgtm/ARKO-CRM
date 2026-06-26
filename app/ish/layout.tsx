import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Tabel — Davomat',
  description: 'Ishchilar uchun Keldi/Ketdi davomat ilovasi',
  manifest: '/ish/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tabel',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b0d13',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function IshLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
