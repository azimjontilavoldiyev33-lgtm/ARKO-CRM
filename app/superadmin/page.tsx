'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Bill {
  workers: number;
  base: number;
  extraWorkers: number;
  extraCost: number;
  total: number;
}
interface Row {
  _id: string;
  name: string;
  plan: 'basic' | 'pro';
  isActive: boolean;
  createdAt: string;
  bill: Bill;
}

export default function SuperadminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [totalUsd, setTotalUsd] = useState(0);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [err, setErr] = useState('');

  // Onboarding formasi
  const [form, setForm] = useState({ name: '', plan: 'pro', adminUsername: '', adminPassword: '' });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/superadmin/companies');
    if (res.status === 401) { window.location.href = '/login'; return; }
    if (res.status === 403) { router.replace('/admin'); return; }
    const data = await res.json();
    setRows(data.companies || []);
    setTotalUsd(data.totalUsd || 0);
    setTotalWorkers(data.totalWorkers || 0);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const createCompany = async () => {
    setCreating(true);
    setCreateMsg('');
    setErr('');
    try {
      const res = await fetch('/api/superadmin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || 'Xato'); return; }
      setCreateMsg(`✅ "${form.name}" yaratildi. Admin: ${form.adminUsername}`);
      setForm({ name: '', plan: 'pro', adminUsername: '', adminPassword: '' });
      await load();
    } finally {
      setCreating(false);
    }
  };

  const patchCompany = async (id: string, patch: Record<string, unknown>) => {
    await fetch(`/api/superadmin/companies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    await load();
  };

  if (loading) {
    return <div style={S.center}>Yuklanmoqda...</div>;
  }

  return (
    <div style={S.wrap}>
      <div style={S.inner}>
        <header style={{ marginBottom: 28 }}>
          <p style={S.kicker}>SUPERADMIN</p>
          <h1 style={S.h1}>Korxonalar va to&apos;lov</h1>
        </header>

        {/* KPI kartalar */}
        <div style={S.kpiRow}>
          <div style={S.kpi}>
            <span style={S.kpiLabel}>Korxonalar</span>
            <span style={S.kpiValue}>{rows.length}</span>
          </div>
          <div style={S.kpi}>
            <span style={S.kpiLabel}>Jami ishchilar</span>
            <span style={S.kpiValue}>{totalWorkers}</span>
          </div>
          <div style={{ ...S.kpi, borderColor: 'var(--color-accent)' }}>
            <span style={S.kpiLabel}>Oylik daromad</span>
            <span style={{ ...S.kpiValue, color: 'var(--color-accent)' }}>${totalUsd.toFixed(1)}</span>
          </div>
        </div>

        {/* Onboarding formasi */}
        <section style={S.card}>
          <h2 style={S.h2}>Yangi korxona qo&apos;shish</h2>
          {err && <div style={S.error}>❌ {err}</div>}
          {createMsg && <div style={S.success}>{createMsg}</div>}
          <div style={S.formGrid}>
            <input style={S.input} placeholder="Korxona nomi" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <select style={S.input} value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}>
              <option value="pro">Pro tarif</option>
              <option value="basic">Basic tarif</option>
            </select>
            <input style={S.input} placeholder="Admin login" autoComplete="off" value={form.adminUsername}
              onChange={(e) => setForm({ ...form, adminUsername: e.target.value })} />
            <input style={S.input} placeholder="Admin parol (≥6)" type="text" autoComplete="off" value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} />
          </div>
          <button style={S.btn} disabled={creating} onClick={createCompany}>
            {creating ? 'Yaratilmoqda...' : 'Korxona yaratish'}
          </button>
        </section>

        {/* Korxonalar jadvali */}
        <section style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {['Korxona', 'Tarif', 'Ishchi', 'Hisob ($/oy)', 'Holat', ''].map((h) => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} style={{ opacity: r.isActive ? 1 : 0.5 }}>
                    <td style={S.td}>{r.name}</td>
                    <td style={S.td}>
                      <select
                        value={r.plan}
                        onChange={(e) => patchCompany(r._id, { plan: e.target.value })}
                        style={S.miniSelect}
                      >
                        <option value="pro">Pro</option>
                        <option value="basic">Basic</option>
                      </select>
                    </td>
                    <td style={S.td}>{r.bill.workers}</td>
                    <td style={{ ...S.td, fontWeight: 700, color: 'var(--color-accent)' }}>
                      ${r.bill.total.toFixed(1)}
                      {r.bill.extraWorkers > 0 && (
                        <span style={S.hint}> (50 + {r.bill.extraWorkers}×2.5)</span>
                      )}
                    </td>
                    <td style={S.td}>
                      <span style={r.isActive ? S.badgeOn : S.badgeOff}>
                        {r.isActive ? 'Faol' : "To'xtatilgan"}
                      </span>
                    </td>
                    <td style={S.td}>
                      <button
                        onClick={() => patchCompany(r._id, { isActive: !r.isActive })}
                        style={r.isActive ? S.btnDanger : S.btnGhost}
                      >
                        {r.isActive ? "To'xtatish" : 'Faollashtirish'}
                      </button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: 'var(--color-muted)' }}>Korxona yo&apos;q</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

const S: Record<string, React.CSSProperties> = {
  wrap: { minHeight: '100vh', background: 'var(--color-bg)', padding: '32px 20px', fontFamily: 'var(--font-sans)' },
  inner: { maxWidth: 1000, margin: '0 auto' },
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-muted)', background: 'var(--color-bg)' },
  kicker: { color: 'var(--color-faint)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', margin: '0 0 4px' },
  h1: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--color-text)', margin: 0 },
  h2: { fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 16px' },
  kpiRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 24 },
  kpi: { background: 'var(--color-panel)', border: '1px solid var(--color-border-soft)', borderRadius: 14, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6 },
  kpiLabel: { color: 'var(--color-muted)', fontSize: 12 },
  kpiValue: { fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--color-text)' },
  card: { background: 'var(--color-panel)', border: '1px solid var(--color-border-soft)', borderRadius: 16, padding: 24, marginBottom: 24 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 },
  input: { background: 'var(--color-base)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px', color: 'var(--color-text)', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
  btn: { background: 'linear-gradient(135deg, #f5cf5a 0%, #e6b733 100%)', color: '#0f1117', border: 'none', borderRadius: 10, padding: '12px 22px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnDanger: { background: 'transparent', border: '1px solid #4a1a1a', color: 'var(--color-danger)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  btnGhost: { background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: { textAlign: 'left', padding: '14px 16px', color: 'var(--color-muted)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', borderBottom: '1px solid var(--color-border-soft)', whiteSpace: 'nowrap' },
  td: { padding: '14px 16px', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border-soft)', whiteSpace: 'nowrap' },
  miniSelect: { background: 'var(--color-base)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '5px 8px', color: 'var(--color-text)', fontSize: 13 },
  hint: { color: 'var(--color-faint)', fontSize: 11, fontWeight: 400 },
  badgeOn: { background: 'rgba(74,222,128,0.12)', color: 'var(--color-success)', borderRadius: 6, padding: '3px 10px', fontSize: 12 },
  badgeOff: { background: 'rgba(248,113,113,0.12)', color: 'var(--color-danger)', borderRadius: 6, padding: '3px 10px', fontSize: 12 },
  error: { background: '#2a1414', border: '1px solid #4a1a1a', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: 'var(--color-danger)', fontSize: 13 },
  success: { background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14, color: 'var(--color-success)', fontSize: 13 },
};
