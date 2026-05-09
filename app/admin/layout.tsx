'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/workers', label: 'Ustalar', icon: '👷' },
  { href: '/admin/orders', label: 'Buyurtmalar', icon: '📦' },
  { href: '/admin/tasks', label: 'Vazifalar', icon: '📋' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f1117', fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />

      {/* Sidebar */}
      <aside style={{ width: '240px', background: '#13151e', borderRight: '1px solid #1e2130', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 50 }}>

        {/* Logo */}
        <div style={{ padding: '28px 24px', borderBottom: '1px solid #1e2130' }}>
          <p style={{ color: '#444', fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', margin: '0 0 4px' }}>Mebel</p>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '20px', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #fff 0%, #888 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Smart CRM
          </h2>
        </div>

        {/* Nav */}
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0c040', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#0f1117', fontFamily: "'Syne', sans-serif" }}>A</div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#e8e8e8', fontWeight: 500 }}>Admin</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#444' }}>Bosh operator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', flex: 1, minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}