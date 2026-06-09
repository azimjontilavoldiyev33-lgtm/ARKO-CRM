'use client';

import { useEffect, useState, useCallback } from 'react';

interface Tx { _id: string; type: 'income' | 'expense'; category: string; amount: number; note: string; date: string; }
interface TrendItem { label: string; year: number; month: number; income: number; expense: number; payroll: number; profit: number; }
interface Data {
  month: number; year: number;
  payroll: number; income: number; expense: number; profit: number;
  transactions: Tx[];
  trend: TrendItem[];
}

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const fmt = (n: number) => Math.round(n).toLocaleString('uz-UZ');
const CATS: Record<string, string[]> = {
  income: ['buyurtma', 'avans', 'boshqa'],
  expense: ['material', 'ijara', 'jihoz', 'transport', 'kommunal', 'boshqa'],
};

export default function ReportsPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'expense', category: 'material', amount: '', note: '', date: new Date().toISOString().slice(0, 10) });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/finance?month=${month}&year=${year}`);
      const d = await res.json();
      if (!d.error) setData(d);
    } finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.companyName) setCompany(d.companyName); }).catch(() => {}); }, []);

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear((y) => y + 1); } else setMonth((m) => m + 1); };

  const addTx = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      const res = await fetch('/api/finance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setForm((f) => ({ ...f, amount: '', note: '' })); await fetchData(); }
    } finally { setSaving(false); }
  };

  const deleteTx = async (id: string) => {
    if (!confirm('Yozuvni o\'chirasizmi?')) return;
    const res = await fetch(`/api/finance/${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const setType = (t: string) => setForm((f) => ({ ...f, type: t, category: CATS[t][0] }));

  const trend = data?.trend ?? [];
  const maxVal = Math.max(1, ...trend.map((t) => Math.max(t.income, t.expense + t.payroll)));
  const inputCls = 'bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-3 py-2.5 text-[#e8e8e8] text-sm outline-none focus:border-[#3a3d4a]';

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header + month nav */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-[#f0c040] text-[11px] uppercase tracking-[2px] mb-1">{company || 'Tabel'}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0" style={{ fontFamily: "'Syne', sans-serif" }}>
              Hisobotlar
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-[#888] hover:text-white transition">◀</button>
            <div className="px-4 py-2 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-center min-w-[150px]">
              <span className="font-semibold text-sm">{MONTHS[month - 1]} {year}</span>
            </div>
            <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-[#1a1d27] border border-[#2a2d3a] text-[#888] hover:text-white transition">▶</button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4">
            <p className="text-[#666] text-[10px] uppercase tracking-widest m-0 mb-2">Daromad</p>
            <p className="text-lg sm:text-2xl font-extrabold text-emerald-400 m-0 whitespace-nowrap" style={{ fontFamily: "'Syne', sans-serif" }}>{fmt(data?.income ?? 0)}</p>
          </div>
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4">
            <p className="text-[#666] text-[10px] uppercase tracking-widest m-0 mb-2">Xarajat</p>
            <p className="text-lg sm:text-2xl font-extrabold text-red-400 m-0 whitespace-nowrap" style={{ fontFamily: "'Syne', sans-serif" }}>{fmt(data?.expense ?? 0)}</p>
          </div>
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4">
            <p className="text-[#666] text-[10px] uppercase tracking-widest m-0 mb-2">Oylik fond</p>
            <p className="text-lg sm:text-2xl font-extrabold text-amber-400 m-0 whitespace-nowrap" style={{ fontFamily: "'Syne', sans-serif" }}>{fmt(data?.payroll ?? 0)}</p>
          </div>
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4">
            <p className="text-[#666] text-[10px] uppercase tracking-widest m-0 mb-2">Foyda</p>
            <p className={`text-lg sm:text-2xl font-extrabold m-0 whitespace-nowrap ${(data?.profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} style={{ fontFamily: "'Syne', sans-serif" }}>{fmt(data?.profit ?? 0)}</p>
          </div>
        </div>

        {/* Trend chart */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="m-0 font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>6 oylik trend</p>
            <div className="flex items-center gap-3 text-[11px] text-[#888]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Daromad</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> Xarajat+oylik</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2 sm:gap-4" style={{ height: 150 }}>
            {trend.map((t, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
                <div className="flex items-end gap-1 w-full justify-center h-full">
                  <div title={`Daromad: ${fmt(t.income)}`} className="w-3 sm:w-5 rounded-t bg-emerald-500/80" style={{ height: `${(t.income / maxVal) * 100}%`, minHeight: t.income > 0 ? 3 : 0 }} />
                  <div title={`Xarajat+oylik: ${fmt(t.expense + t.payroll)}`} className="w-3 sm:w-5 rounded-t bg-red-500/80" style={{ height: `${((t.expense + t.payroll) / maxVal) * 100}%`, minHeight: (t.expense + t.payroll) > 0 ? 3 : 0 }} />
                </div>
                <span className="text-[10px] text-[#666]">{t.label}</span>
                <span className={`text-[10px] font-semibold ${t.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{t.profit >= 0 ? '+' : ''}{fmt(t.profit / 1000)}k</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add transaction */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5 mb-5">
          <p className="m-0 mb-3 font-bold text-sm" style={{ fontFamily: "'Syne', sans-serif" }}>Yozuv qo&apos;shish</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex rounded-lg overflow-hidden border border-[#2a2d3a] shrink-0">
              <button onClick={() => setType('income')} className={`px-3 py-2.5 text-sm font-semibold transition ${form.type === 'income' ? 'bg-emerald-500 text-[#0f1117]' : 'bg-[#0f1117] text-[#888]'}`}>+ Daromad</button>
              <button onClick={() => setType('expense')} className={`px-3 py-2.5 text-sm font-semibold transition ${form.type === 'expense' ? 'bg-red-500 text-white' : 'bg-[#0f1117] text-[#888]'}`}>− Xarajat</button>
            </div>
            <select className={inputCls} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              {CATS[form.type].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className={inputCls + ' sm:w-36'} placeholder="Summa" inputMode="numeric" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, '') }))} />
            <input className={inputCls + ' sm:flex-1'} placeholder="Izoh (ixtiyoriy)" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} />
            <input type="date" className={inputCls} value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            <button onClick={addTx} disabled={saving || !form.amount} className="bg-[#f0c040] text-[#0f1117] rounded-lg px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap">{saving ? '...' : 'Qo\'shish'}</button>
          </div>
        </div>

        {/* Transactions list */}
        <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-hidden">
          <p className="m-0 px-4 sm:px-5 py-3 font-bold text-sm border-b border-[#2a2d3a]" style={{ fontFamily: "'Syne', sans-serif" }}>
            {MONTHS[month - 1]} yozuvlari {data ? `(${data.transactions.length})` : ''}
          </p>
          {loading ? (
            <div className="py-12 text-center text-[#555] text-sm">Yuklanmoqda...</div>
          ) : !data || data.transactions.length === 0 ? (
            <div className="py-12 text-center text-[#555] text-sm">Bu oyda yozuv yo&apos;q — daromad/xarajat qo&apos;shing</div>
          ) : (
            <div className="divide-y divide-[#23262f]">
              {data.transactions.map((t) => (
                <div key={t._id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 hover:bg-[#1f2235] transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 ${t.type === 'income' ? 'bg-[#142614] text-emerald-400' : 'bg-[#2a1414] text-red-400'}`}>{t.type === 'income' ? '↓' : '↑'}</span>
                    <div className="min-w-0">
                      <p className="m-0 text-sm font-medium capitalize">{t.category}{t.note && <span className="text-[#666] font-normal"> · {t.note}</span>}</p>
                      <p className="m-0 text-[11px] text-[#555]">{new Date(t.date).toLocaleDateString('uz-UZ')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-bold whitespace-nowrap ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>{t.type === 'income' ? '+' : '−'}{fmt(t.amount)}</span>
                    <button onClick={() => deleteTx(t._id)} className="text-[#555] hover:text-red-400 text-sm opacity-0 group-hover:opacity-100 transition">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[#444] text-[11px] mt-3">Foyda = Daromad − Xarajat − Oylik fond · oylik fond ustalar maoshidan avtomatik · daromad/xarajatni qo&apos;lda kiritasiz</p>
      </div>
    </div>
  );
}
