'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, clearSession, getToken } from '../_lib/store';
import NotificationButton from '../_lib/NotificationButton';

type Profile = {
  worker: {
    fullName: string;
    phoneNumber: string;
    position: string | null;
    code: string | null;
    salary: number;
    deviceBound: boolean;
    createdAt: string;
  };
  company: string | null;
  stats: {
    workDaysThisMonth: number;
    completedTasks: number;
    activeTasks: number;
    avgRating: number | null;
  };
};

export default function ProfilePage() {
  const router = useRouter();
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await apiFetch('/api/mobile/me');
      if (res.status === 401) {
        clearSession();
        router.replace('/ish/login');
        return;
      }
      const json = await res.json();
      if (json?.success) setData(json as Profile);
    } catch {
      /* tarmoq yo'q */
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/ish/login');
      return;
    }
    load();
  }, [router, load]);

  const logout = () => {
    clearSession();
    router.replace('/ish/login');
  };

  const w = data?.worker;
  const initials = w?.fullName?.split(' ').map((n) => n[0]).slice(0, 2).join('') || '?';

  return (
    <div style={S.wrap}>
      <div aria-hidden style={S.glow} />
      <div style={S.inner}>
        {/* Topbar */}
        <div style={S.topbar}>
          <Link href="/ish" style={S.back} aria-label="Orqaga">←</Link>
          <span style={S.topTitle}>Profil</span>
          <span style={{ width: 40 }} />
        </div>

        {loading ? (
          <p style={S.muted}>Yuklanmoqda...</p>
        ) : !w ? (
          <p style={S.muted}>Ma&apos;lumot topilmadi</p>
        ) : (
          <>
            {/* Avatar + ism */}
            <div style={S.hero}>
              <div style={S.avatar}>{initials}</div>
              <h1 style={S.name}>{w.fullName}</h1>
              {w.position && <p style={S.position}>{w.position}</p>}
              {data?.company && <span style={S.companyTag}>🏢 {data.company}</span>}
            </div>

            {/* Statistika */}
            <div style={S.statGrid}>
              <Stat value={data!.stats.workDaysThisMonth} label="Shu oy kun" />
              <Stat value={data!.stats.completedTasks} label="Bajarilgan" />
              <Stat value={data!.stats.activeTasks} label="Faol vazifa" />
              <Stat value={data!.stats.avgRating != null ? `⭐ ${data!.stats.avgRating}` : '—'} label="O'rtacha baho" />
            </div>

            {/* Ma'lumotlar */}
            <section style={{ marginTop: 22 }}>
              <h2 style={S.sectionTitle}>Ma&apos;lumotlar</h2>
              <div style={S.card}>
                <Row icon="📞" label="Telefon" value={`+${w.phoneNumber}`} />
                {w.code && <Row icon="🔑" label="Kirish kodi" value={`#${w.code}`} mono />}
                {w.salary > 0 && <Row icon="💰" label="Oylik" value={`${w.salary.toLocaleString('uz-UZ')} so'm`} />}
                <Row icon="📱" label="Qurilma" value={w.deviceBound ? 'Biriktirilgan' : 'Biriktirilmagan'} />
                <Row icon="📅" label="Qo'shilgan" value={new Date(w.createdAt).toLocaleDateString('uz-UZ')} last />
              </div>
            </section>

            {/* Sozlamalar */}
            <section style={{ marginTop: 22 }}>
              <h2 style={S.sectionTitle}>Sozlamalar</h2>
              <NotificationButton />
              <button onClick={logout} style={S.logoutBtn}>
                ⏻ Chiqish
              </button>
            </section>

            <p style={S.footer}>Tabel — ishchi ilovasi</p>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div style={S.statCard}>
      <p style={S.statValue}>{value}</p>
      <p style={S.statLabel}>{label}</p>
    </div>
  );
}

function Row({ icon, label, value, mono, last }: { icon: string; label: string; value: string; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ ...S.row, borderBottom: last ? 'none' : '1px solid #1d2030' }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{ color: '#7a7d8a', fontSize: 13, flex: 1 }}>{label}</span>
      <span style={{ color: '#e8e8e8', fontSize: 14, fontWeight: 500, fontFamily: mono ? 'var(--font-display)' : undefined, letterSpacing: mono ? 1 : undefined }}>
        {value}
      </span>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: '#0b0d13',
    fontFamily: 'var(--font-sans)',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px 20px calc(24px + env(safe-area-inset-bottom))',
  },
  glow: {
    position: 'absolute', top: '-20%', left: '50%', transform: 'translateX(-50%)',
    width: 600, height: 400,
    background: 'radial-gradient(circle, rgba(240,192,64,0.10) 0%, rgba(240,192,64,0) 70%)',
    pointerEvents: 'none',
  },
  inner: { width: 460, maxWidth: '100%', margin: '0 auto', position: 'relative', zIndex: 1 },
  topbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back: {
    width: 40, height: 40, borderRadius: 12, background: '#14161f', border: '1px solid #23263a',
    color: '#cfd2dc', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
  },
  topTitle: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: '#fff' },
  hero: { textAlign: 'center', marginBottom: 24 },
  avatar: {
    width: 84, height: 84, borderRadius: 24, margin: '0 auto 14px',
    background: 'linear-gradient(135deg, #f5cf5a 0%, #e0b030 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 32, fontWeight: 800, color: '#0f1117', fontFamily: 'var(--font-display)',
    boxShadow: '0 10px 30px rgba(240,192,64,0.3)',
  },
  name: { fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 0 4px', letterSpacing: '-0.5px' },
  position: { color: '#7a7d8a', fontSize: 14, margin: '0 0 10px' },
  companyTag: { display: 'inline-block', background: '#14161f', border: '1px solid #23263a', color: '#9aabbf', fontSize: 12, padding: '4px 12px', borderRadius: 999 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  statCard: { background: '#14161f', border: '1px solid #23263a', borderRadius: 16, padding: '16px', textAlign: 'center' },
  statValue: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#f0c040', margin: '0 0 4px' },
  statLabel: { color: '#7a7d8a', fontSize: 12, margin: 0 },
  sectionTitle: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: '#cfd2dc', margin: '0 0 12px' },
  card: { background: '#14161f', border: '1px solid #23263a', borderRadius: 16, padding: '4px 16px' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0' },
  logoutBtn: {
    width: '100%', marginTop: 12, background: '#1a0f0f', border: '1px solid #4a1a1a', color: '#f87171',
    borderRadius: 12, padding: '13px', fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', cursor: 'pointer',
  },
  muted: { color: '#5a5d6a', fontSize: 14, textAlign: 'center', marginTop: 40 },
  footer: { textAlign: 'center', color: '#3a3d4a', fontSize: 12, marginTop: 32 },
};
