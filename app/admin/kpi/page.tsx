'use client';

import { useEffect, useState, useCallback } from 'react';

interface Row {
  _id: string;
  fullName: string;
  position: string;
  completed: number;
  inProgress: number;
  pending: number;
  onTimeRate: number | null;
  avgRating: number | null;
  workDays: number;
  hours: number;
  overtimeHours: number;
}
interface Data {
  period: string;
  workers: Row[];
  summary: { totalCompleted: number; totalHours: number; avgOnTime: number | null; top: string | null };
}

const PERIODS: { key: string; label: string }[] = [
  { key: 'month', label: 'Bu oy' },
  { key: '30d', label: '30 kun' },
  { key: 'all', label: 'Hammasi' },
];

export default function KpiPage() {
  const [period, setPeriod] = useState('month');
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kpi?period=${period}`);
      const d = await res.json();
      if (!d.error) setData(d);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.companyName) setCompany(d.companyName); }).catch(() => {});
  }, []);

  const workers = data?.workers ?? [];
  const s = data?.summary;

  return (
    <div className="min-h-screen bg-[#0f1117] text-[#e8e8e8]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');`}</style>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header + period filter */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <p className="text-[#f0c040] text-[11px] uppercase tracking-[2px] mb-1">{company || 'Tabel'}</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-br from-white to-[#888] bg-clip-text text-transparent m-0" style={{ fontFamily: "'Syne', sans-serif" }}>
              Samaradorlik · KPI
            </h1>
          </div>
          <div className="flex items-center gap-1.5 bg-[#1a1d27] border border-[#2a2d3a] rounded-xl p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition ${period === p.key ? 'bg-[#f0c040] text-[#0f1117]' : 'text-[#888] hover:text-white'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[#666] text-[10px] sm:text-[11px] uppercase tracking-widest m-0">Bajarilgan vazifa</p>
              <span className="w-8 h-8 rounded-lg bg-[#142614] text-emerald-400 flex items-center justify-center text-sm shrink-0">✅</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 m-0" style={{ fontFamily: "'Syne', sans-serif" }}>{s?.totalCompleted ?? 0}</p>
          </div>
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[#666] text-[10px] sm:text-[11px] uppercase tracking-widest m-0">O&apos;rtacha o&apos;z vaqtida</p>
              <span className="w-8 h-8 rounded-lg bg-[#2a2410] text-[#f0c040] flex items-center justify-center text-sm shrink-0">🎯</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#f0c040] m-0" style={{ fontFamily: "'Syne', sans-serif" }}>{s?.avgOnTime != null ? s.avgOnTime + '%' : '—'}</p>
          </div>
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] p-4 sm:p-5">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[#666] text-[10px] sm:text-[11px] uppercase tracking-widest m-0">Eng samarali usta</p>
              <span className="w-8 h-8 rounded-lg bg-[#2a1a2a] text-[#c084fc] flex items-center justify-center text-sm shrink-0">👑</span>
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-[#c084fc] m-0 truncate" style={{ fontFamily: "'Syne', sans-serif" }} title={s?.top || ''}>{s?.top || '—'}</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-16 flex flex-col items-center gap-3 text-[#555]">
            <div className="w-8 h-8 rounded-full border-2 border-[#f0c040] border-t-transparent animate-spin" />
            <p className="text-sm">Yuklanmoqda...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] py-20 text-center text-[#555]">
            <p className="text-5xl mb-3">📊</p>
            <p className="text-sm">Ma&apos;lumot yo&apos;q — vazifa va davomat to&apos;planishi bilan KPI chiqadi</p>
          </div>
        ) : (
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2a2d3a] overflow-x-auto">
            <table className="w-full border-collapse text-sm min-w-[640px]">
              <thead>
                <tr className="bg-[#14161f]">
                  <th className="px-4 py-3 text-left text-[#555] text-[11px] uppercase tracking-widest font-medium">Usta</th>
                  <th className="px-3 py-3 text-center text-emerald-400 text-[11px] uppercase tracking-widest font-medium">Bajarilgan</th>
                  <th className="px-3 py-3 text-center text-[#f0c040] text-[11px] uppercase tracking-widest font-medium">O&apos;z vaqtida</th>
                  <th className="px-3 py-3 text-center text-[#c084fc] text-[11px] uppercase tracking-widest font-medium">Baho</th>
                  <th className="px-3 py-3 text-center text-[#555] text-[11px] uppercase tracking-widest font-medium">Kun</th>
                  <th className="px-3 py-3 text-center text-[#555] text-[11px] uppercase tracking-widest font-medium">Soat</th>
                  <th className="px-3 py-3 text-center text-amber-400 text-[11px] uppercase tracking-widest font-medium">Overtime</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w, i) => (
                  <tr key={w._id} className="border-t border-[#23262f] hover:bg-[#1f2235] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white flex items-center gap-1.5">
                        {i === 0 && w.completed > 0 && <span title="Eng samarali">👑</span>}
                        {w.fullName}
                      </p>
                      <p className="text-xs text-[#555]">
                        {w.position || '—'}
                        {(w.inProgress > 0 || w.pending > 0) && (
                          <span className="text-[#666]"> · {w.inProgress} jarayonda · {w.pending} kutilmoqda</span>
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-center font-bold text-emerald-400">{w.completed}</td>
                    <td className="px-3 py-3 text-center font-semibold text-[#f0c040]">{w.onTimeRate != null ? w.onTimeRate + '%' : '—'}</td>
                    <td className="px-3 py-3 text-center font-semibold text-[#c084fc]">{w.avgRating != null ? '⭐ ' + w.avgRating : '—'}</td>
                    <td className="px-3 py-3 text-center text-white">{w.workDays}</td>
                    <td className="px-3 py-3 text-center text-white">{w.hours}</td>
                    <td className="px-3 py-3 text-center text-amber-400 font-semibold">{w.overtimeHours} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-[#444] text-[11px] mt-3">
          Vazifa (status/deadline/baho) va davomat (kelish-ketish)dan avtomatik hisoblanadi · o&apos;z vaqtida % = belgilangan muddatda bajarilgan vazifalar ulushi
        </p>
      </div>
    </div>
  );
}
