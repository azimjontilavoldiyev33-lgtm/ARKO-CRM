'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import Link from 'next/link';
import InstallPWAButton from '../_lib/InstallPWAButton';

// pro: true — faqat Pro tarifdagi korxonalar ko'radi (Basic'da yashiriladi)
const navItems: { href: string; label: string; icon: string; pro?: boolean }[] = [
  { href: '/admin',                label: 'Dashboard',    icon: '📊' },
  { href: '/admin/workers',        label: 'Ustalar',      icon: '👷' },
  { href: '/admin/orders',         label: 'Buyurtmalar',  icon: '📦', pro: true },
  { href: '/admin/tasks',          label: 'Vazifalar',    icon: '📋', pro: true },
  { href: '/admin/inventory',      label: 'Ombor',        icon: '🧱', pro: true },
  { href: '/admin/attendance',     label: 'Davomat',      icon: '⏰' },
  { href: '/admin/salary',         label: 'Oylik hisob',  icon: '💰' },
  { href: '/admin/kpi',            label: 'Samaradorlik', icon: '📈', pro: true },
  { href: '/admin/reports',        label: 'Hisobotlar',   icon: '💹', pro: true },
  { href: '/admin/pipelines',      label: 'Ish zanjiri',  icon: '🔗', pro: true },
  { href: '/admin/office-location', label: 'Ofis hududi', icon: '📍' },
];

export default function AdminLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<{ username: string; companyName: string; role: string; plan?: string } | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  // Close sidebar on route change (mobile)
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when sidebar open on mobile
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (open && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Kirgan admin + korxona nomi + tarif (sidebar konteksti).
  // 401 — korxona o'chirilgan yoki sessiya yo'q -> login'ga qaytariladi.
  useEffect(() => {
    fetch('/api/me')
      .then((r) => {
        if (r.status === 401) { window.location.href = '/login'; return null; }
        return r.ok ? r.json() : null;
      })
      .then((d) => { if (d && !d.error) setMe(d); })
      .catch(() => {});
  }, []);

  const companyLabel = me?.companyName || 'Korxona';
  const userLabel = me?.username || 'Admin';
  const avatarLetter = (me?.companyName || me?.username || 'T').charAt(0).toUpperCase();

  const currentLabel = navItems.find(({ href }) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
  )?.label ?? 'Admin';

  // Pro-only nav faqat Pro tarifda ko'rinadi (me yuklanmaguncha yashirin — xavfsiz default)
  const isPro = me?.plan === 'pro';
  const visibleNav = navItems.filter((item) => !item.pro || isPro);

  // Basic admin to'g'ridan-to'g'ri Pro sahifani ochsa — bloklab, xabar ko'rsatamiz
  const proRoutes = ['/admin/orders', '/admin/tasks', '/admin/inventory', '/admin/pipelines', '/admin/kpi', '/admin/reports'];
  const blockedByPlan =
    !isPro && me !== null && proRoutes.some((r) => pathname === r || pathname.startsWith(r + '/'));

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0f1117',
      fontFamily: "var(--font-sans)",
    }}>
{/* ── Backdrop (mobile only) ─────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 40,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.22s ease',
          // Only matters on mobile; desktop sidebar is always visible
        }}
      />

      {/* ── Sidebar ────────────────────────────────────────── */}
      <aside
        ref={sidebarRef}
        aria-label="Asosiy navigatsiya"
        style={{
          width: '240px',
          background: '#13151e',
          borderRight: '1px solid #1e2130',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 50,
          // Mobile: slide in/out. Desktop: always visible via CSS override below.
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.22s cubic-bezier(0.4,0,0.2,1)',
        }}
        className="admin-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '28px 24px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Davomat + CRM
            </p>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: '20px',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Tabel
            </h2>
          </div>

          {/* Close button — mobile only (hidden via CSS on desktop) */}
          <button
            onClick={() => setOpen(false)}
            aria-label="Menyuni yopish"
            className="admin-sidebar-close"
            style={{
              background: 'none',
              border: 'none',
              color: '#555',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '20px',
              lineHeight: 1,
              marginTop: '2px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
          {visibleNav.map((item) => {
            const isActive =
              item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: '10px',
                  marginBottom: '4px',
                  textDecoration: 'none',
                  background: isActive ? '#1e2235' : 'transparent',
                  color: isActive ? '#e8e8e8' : '#555',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  borderLeft: isActive ? '3px solid #f0c040' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e2130' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{
              width: '34px', height: '34px',
              borderRadius: '8px',
              background: '#f0c040',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800,
              color: '#0f1117',
              fontFamily: "var(--font-display)",
              flexShrink: 0,
            }}>{avatarLetter}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '13px', color: '#e8e8e8', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={companyLabel}>{companyLabel}</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userLabel}</p>
            </div>
          </div>
          <InstallPWAButton fullWidth dropUp style={{ marginBottom: '10px' }} />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              width: '100%',
              background: 'transparent',
              border: '1px solid #2a2d3a',
              color: '#888',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = '#4a1a1a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#888'; e.currentTarget.style.borderColor = '#2a2d3a'; }}
          >
            Chiqish
          </button>
        </div>
      </aside>

      {/* ── Main ───────────────────────────────────────────── */}
      <div className="admin-main" style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

        {/* Mobile topbar */}
        <header
          className="admin-topbar"
          style={{
            display: 'none', // shown via CSS on mobile
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            height: '52px',
            background: '#13151e',
            borderBottom: '1px solid #1e2130',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => setOpen(true)}
            aria-label="Menyuni ochish"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#aaa',
              fontSize: '22px',
              padding: '4px 8px',
              lineHeight: 1,
            }}
          >
            ☰
          </button>

          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: '15px',
            fontWeight: 700,
            color: '#e8e8e8',
          }}>
            {currentLabel}
          </span>

          {/* Avatar — korxona nomi bosh harfi */}
          <div style={{
            width: '28px', height: '28px',
            borderRadius: '6px',
            background: '#f0c040',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 800, color: '#0f1117',
          }}>{avatarLetter}</div>
        </header>

        <main style={{ flex: 1 }}>
          {blockedByPlan ? (
            <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '24px' }}>
              <div style={{ fontSize: '44px', marginBottom: '16px' }}>🔒</div>
              <h2 style={{ fontFamily: "var(--font-display)", color: '#e8e8e8', fontSize: '22px', margin: '0 0 8px' }}>Bu bo&apos;lim Pro tarifda</h2>
              <p style={{ color: '#888', fontSize: '14px', maxWidth: '380px', margin: 0, lineHeight: 1.6 }}>
                Buyurtma, vazifa va ish zanjiri — Pro tarif imkoniyatlari. Yoqish uchun administrator bilan bog&apos;laning.
              </p>
            </div>
          ) : children}
        </main>
      </div>

      {/* ── Responsive styles ───────────────────────────────── */}
      <style>{`
        /* Desktop: sidebar always visible */
        @media (min-width: 769px) {
          .admin-sidebar {
            transform: translateX(0) !important;
          }
          .admin-sidebar-close {
            display: none !important;
          }
          .admin-main {
            margin-left: 240px;
          }
          .admin-topbar {
            display: none !important;
          }
        }

        /* Mobile: sidebar slides, topbar shows */
        @media (max-width: 768px) {
          .admin-main {
            margin-left: 0 !important;
          }
          .admin-topbar {
            display: flex !important;
          }
        }

        /* Nav link hover */
        .admin-sidebar nav a:hover {
          background: #1a1c2a !important;
          color: #aaa !important;
        }
      `}</style>
    </div>
  );
}