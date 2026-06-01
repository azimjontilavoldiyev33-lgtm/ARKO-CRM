'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/admin',         label: 'Dashboard',   icon: '📊' },
  { href: '/admin/workers', label: 'Ustalar',      icon: '👷' },
  { href: '/admin/orders',  label: 'Buyurtmalar',  icon: '📦' },
  { href: '/admin/tasks',   label: 'Vazifalar',    icon: '📋' },
  { href: '/admin/salary',  label: 'Oylik hisob',  icon: '💰' },
    { href: '/admin/pipelines', label: 'Ish zanjiri',  icon: '🔗' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
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

  const currentLabel = navItems.find(({ href }) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
  )?.label ?? 'Admin';

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      background: '#0f1117',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap"
        rel="stylesheet"
      />

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
        // @ts-ignore — inline CSS class trick for desktop override
        className="admin-sidebar"
      >
        {/* Logo */}
        <div style={{ padding: '28px 24px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <p style={{ color: '#444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>
              Mebel
            </p>
            <h2 style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '20px',
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #fff 0%, #888 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Smart CRM
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
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map((item) => {
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
        <div style={{ padding: '20px 24px', borderTop: '1px solid #1e2130' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px',
              borderRadius: '8px',
              background: '#f0c040',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '14px', fontWeight: 800,
              color: '#0f1117',
              fontFamily: "'Syne', sans-serif",
            }}>A</div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#e8e8e8', fontWeight: 500 }}>Admin</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#444' }}>Bosh operator</p>
            </div>
          </div>
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
            fontFamily: "'Syne', sans-serif",
            fontSize: '15px',
            fontWeight: 700,
            color: '#e8e8e8',
          }}>
            {currentLabel}
          </span>

          {/* Avatar placeholder for visual balance */}
          <div style={{
            width: '28px', height: '28px',
            borderRadius: '6px',
            background: '#f0c040',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 800, color: '#0f1117',
          }}>A</div>
        </header>

        <main style={{ flex: 1 }}>
          {children}
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